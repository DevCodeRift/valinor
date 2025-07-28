import { Client, GatewayIntentBits, Events, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { GraphQLClient } from 'graphql-request'
import * as cron from 'node-cron'
import dotenv from 'dotenv'
import { Database } from './database'
import { PoliticsAndWarAPI } from './api'
import { WarMonitor } from './warMonitor'

dotenv.config()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

const database = new Database()
const pwAPI = new PoliticsAndWarAPI()
const warMonitor = new WarMonitor(database, pwAPI, client)

// Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('api')
    .setDescription('Set your Politics and War API key')
    .addStringOption(option =>
      option.setName('key')
        .setDescription('Your Politics and War API key')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('alert')
    .setDescription('Monitor an alliance for war declarations')
    .addIntegerOption(option =>
      option.setName('alliance_id')
        .setDescription('The alliance ID to monitor')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check current monitoring status'),
  
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands'),
]

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`)
  
  // Initialize database
  await database.initialize()
  
  // Register slash commands
  try {
    console.log('Started refreshing application (/) commands.')
    
    // Register commands globally
    await readyClient.application?.commands.set(commands)
    console.log('Successfully reloaded global application (/) commands.')
    
    // Also register for all guilds the bot is in (for faster testing)
    const guilds = readyClient.guilds.cache
    for (const guild of guilds.values()) {
      try {
        await guild.commands.set(commands)
        console.log(`✅ Commands registered for guild: ${guild.name}`)
      } catch (guildError) {
        console.error(`Error registering commands for guild ${guild.name}:`, guildError)
      }
    }
    
  } catch (error) {
    console.error('Error registering commands:', error)
  }
  
  // Start war monitoring
  startWarMonitoring()
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const { commandName, user, guildId, channelId } = interaction

  try {
    switch (commandName) {
      case 'api':
        await handleApiCommand(interaction)
        break
      case 'alert':
        await handleAlertCommand(interaction)
        break
      case 'status':
        await handleStatusCommand(interaction)
        break
      case 'help':
        await handleHelpCommand(interaction)
        break
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error)
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Error')
      .setDescription('An error occurred while processing your command.')
      .setTimestamp()
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true })
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
    }
  }
})

async function handleApiCommand(interaction: ChatInputCommandInteraction) {
  const apiKey = interaction.options.getString('key', true)
  const userId = interaction.user.id
  
  // Store API key in database
  await database.setUserApiKey(userId, apiKey)
  
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ API Key Set')
    .setDescription('Your Politics and War API key has been securely stored.')
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed], ephemeral: true })
}

async function handleAlertCommand(interaction: ChatInputCommandInteraction) {
  const allianceId = interaction.options.getInteger('alliance_id', true)
  const userId = interaction.user.id
  const guildId = interaction.guildId!
  const channelId = interaction.channelId
  
  // Check if user has API key set
  const apiKey = await database.getUserApiKey(userId)
  if (!apiKey) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ API Key Required')
      .setDescription('Please set your API key first using `/api <your_key>`')
      .setTimestamp()
    
    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }
  
  // Add alliance to monitoring
  await database.addMonitoredAlliance(allianceId, guildId, channelId, userId)
  
  // Get alliance info
  try {
    const allianceInfo = await pwAPI.getAllianceInfo(allianceId, apiKey)
    
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🔔 Alliance Monitoring Started')
      .setDescription(`Now monitoring **${allianceInfo.name}** (${allianceInfo.acronym}) for war declarations.`)
      .addFields(
        { name: 'Alliance ID', value: allianceId.toString(), inline: true },
        { name: 'Nations', value: allianceInfo.nations.length.toString(), inline: true },
        { name: 'Score', value: allianceInfo.score.toLocaleString(), inline: true }
      )
      .setTimestamp()
    
    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    const embed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle('⚠️ Alliance Added with Warning')
      .setDescription(`Alliance ID ${allianceId} has been added to monitoring, but we couldn't fetch alliance details. Please verify the alliance ID is correct.`)
      .setTimestamp()
    
    await interaction.reply({ embeds: [embed], ephemeral: true })
  }
}

async function handleStatusCommand(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!
  const monitoredAlliances = await database.getMonitoredAlliances(guildId)
  
  if (monitoredAlliances.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle('📊 Monitoring Status')
      .setDescription('No alliances are currently being monitored in this server.')
      .setTimestamp()
    
    await interaction.reply({ embeds: [embed] })
    return
  }
  
  const allianceList = monitoredAlliances
    .map(alliance => `• Alliance ${alliance.alliance_id} (Channel: <#${alliance.channel_id}>)`)
    .join('\n')
  
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('📊 Monitoring Status')
    .setDescription(`Currently monitoring ${monitoredAlliances.length} alliance(s):`)
    .addFields({ name: 'Monitored Alliances', value: allianceList })
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
}

async function handleHelpCommand(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🤖 Valinor Alliance Monitor Bot')
    .setDescription('Monitor Politics and War alliances for war declarations')
    .addFields(
      { 
        name: '🔑 `/api <key>`', 
        value: 'Set your Politics and War API key (required first step)', 
        inline: false 
      },
      { 
        name: '🔔 `/alert <alliance_id>`', 
        value: 'Start monitoring an alliance for war declarations', 
        inline: false 
      },
      { 
        name: '📊 `/status`', 
        value: 'Check which alliances are being monitored', 
        inline: false 
      },
      { 
        name: '❓ `/help`', 
        value: 'Show this help message', 
        inline: false 
      }
    )
    .addFields(
      {
        name: '🔗 Links',
        value: '[Politics and War](https://politicsandwar.com) • [Valinor Alliance](https://politicsandwar.com/alliance/id=10523)',
        inline: false
      }
    )
    .setTimestamp()
  
  await interaction.reply({ embeds: [embed] })
}

function startWarMonitoring() {
  console.log('🔍 Starting war monitoring...')
  
  // Check for new wars every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await warMonitor.checkForNewWars()
    } catch (error) {
      console.error('Error during war monitoring:', error)
    }
  })
  
  console.log('✅ War monitoring started (checking every 5 minutes)')
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  process.exit(1)
})

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
