import { Client, EmbedBuilder, TextChannel } from 'discord.js'
import { Database, MonitoredAlliance, TrackedWar } from './database'
import { PoliticsAndWarAPI, War } from './api'

export class WarMonitor {
  constructor(
    private database: Database,
    private api: PoliticsAndWarAPI,
    private client: Client
  ) {}

  async checkForNewWars(): Promise<void> {
    console.log('🔍 Checking for new wars...')
    
    try {
      const monitoredAlliances = await this.database.getMonitoredAlliances()
      
      if (monitoredAlliances.length === 0) {
        console.log('No alliances being monitored')
        return
      }
      
      // Group alliances by user to use their API keys
      const alliancesByUser = new Map<string, MonitoredAlliance[]>()
      
      for (const alliance of monitoredAlliances) {
        if (!alliancesByUser.has(alliance.user_id)) {
          alliancesByUser.set(alliance.user_id, [])
        }
        alliancesByUser.get(alliance.user_id)!.push(alliance)
      }
      
      // Check each user's monitored alliances
      for (const [userId, userAlliances] of alliancesByUser) {
        const apiKey = await this.database.getUserApiKey(userId)
        
        if (!apiKey) {
          console.log(`No API key found for user ${userId}, skipping their alliances`)
          continue
        }
        
        for (const alliance of userAlliances) {
          await this.checkAllianceWars(alliance, apiKey)
        }
      }
      
      // Send notifications for new wars
      await this.sendNewWarNotifications()
      
    } catch (error) {
      console.error('Error checking for new wars:', error)
    }
  }

  private async checkAllianceWars(alliance: MonitoredAlliance, apiKey: string): Promise<void> {
    try {
      console.log(`Checking wars for alliance ${alliance.alliance_id}`)
      
      // Get current wars for the alliance
      const wars = await this.api.getAllianceWars(alliance.alliance_id, apiKey, true)
      
      // Filter for defensive wars (where alliance members are defenders)
      const defensiveWars = wars.filter(war => 
        war.defender.alliance?.id === alliance.alliance_id.toString()
      )
      
      // Track new wars
      for (const war of defensiveWars) {
        await this.database.addTrackedWar(
          war.id,
          alliance.alliance_id,
          war.attacker.nation_name,
          war.defender.nation_name,
          war.date
        )
      }
      
    } catch (error) {
      console.error(`Error checking wars for alliance ${alliance.alliance_id}:`, error)
    }
  }

  private async sendNewWarNotifications(): Promise<void> {
    const unnotifiedWars = await this.database.getUnnotifiedWars()
    
    if (unnotifiedWars.length === 0) {
      return
    }
    
    console.log(`📢 Sending notifications for ${unnotifiedWars.length} new wars`)
    
    // Group wars by alliance to send efficient notifications
    const warsByAlliance = new Map<number, TrackedWar[]>()
    
    for (const war of unnotifiedWars) {
      if (!warsByAlliance.has(war.alliance_id)) {
        warsByAlliance.set(war.alliance_id, [])
      }
      warsByAlliance.get(war.alliance_id)!.push(war)
    }
    
    // Send notifications for each alliance
    for (const [allianceId, allianceWars] of warsByAlliance) {
      await this.sendAllianceWarNotifications(allianceId, allianceWars)
    }
  }

  private async sendAllianceWarNotifications(allianceId: number, wars: TrackedWar[]): Promise<void> {
    try {
      // Get all Discord channels monitoring this alliance
      const monitoredAlliances = await this.database.getMonitoredAlliances()
      const allianceMonitors = monitoredAlliances.filter(m => m.alliance_id === allianceId)
      
      if (allianceMonitors.length === 0) {
        console.log(`No Discord channels monitoring alliance ${allianceId}`)
        return
      }
      
      // Create notification embed
      const embed = this.createWarNotificationEmbed(allianceId, wars)
      
      // Send to all monitoring channels
      for (const monitor of allianceMonitors) {
        try {
          const channel = await this.client.channels.fetch(monitor.channel_id) as TextChannel
          
          if (channel && channel.isTextBased()) {
            await channel.send({ embeds: [embed] })
            console.log(`Sent war notification to channel ${monitor.channel_id}`)
          }
          
        } catch (error) {
          console.error(`Failed to send notification to channel ${monitor.channel_id}:`, error)
        }
      }
      
      // Mark wars as notified
      for (const war of wars) {
        await this.database.markWarAsNotified(war.war_id)
      }
      
    } catch (error) {
      console.error(`Error sending notifications for alliance ${allianceId}:`, error)
    }
  }

  private createWarNotificationEmbed(allianceId: number, wars: TrackedWar[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🚨 WAR DECLARATION ALERT')
      .setDescription(`**Alliance ${allianceId}** members are under attack!`)
      .setTimestamp()
    
    if (wars.length === 1) {
      const war = wars[0]
      embed.addFields(
        { name: '⚔️ Attacker', value: war.attacker_nation, inline: true },
        { name: '🛡️ Defender', value: war.defender_nation, inline: true },
        { name: '📅 War Started', value: new Date(war.war_date).toLocaleString(), inline: true }
      )
    } else {
      const warList = wars
        .slice(0, 10) // Limit to prevent embed overflow
        .map(war => `• **${war.attacker_nation}** → **${war.defender_nation}**`)
        .join('\n')
      
      embed.addFields({
        name: `⚔️ ${wars.length} New Wars`,
        value: warList + (wars.length > 10 ? '\n*...and more*' : ''),
        inline: false
      })
    }
    
    embed.addFields({
      name: '🔗 Politics and War',
      value: `[Alliance Page](https://politicsandwar.com/alliance/id=${allianceId})`,
      inline: false
    })
    
    return embed
  }

  async getWarSummary(allianceId: number): Promise<{ total: number, recent: number, active: TrackedWar[] }> {
    const allWars = await this.database.getTrackedWarsForAlliance(allianceId)
    const recentWars = allWars.filter(war => {
      const warDate = new Date(war.war_date)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return warDate > oneDayAgo
    })
    
    return {
      total: allWars.length,
      recent: recentWars.length,
      active: allWars.slice(0, 5) // Most recent 5 wars
    }
  }
}
