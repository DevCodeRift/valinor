import sqlite3 from 'sqlite3'
import { promisify } from 'util'

export interface MonitoredAlliance {
  id: number
  alliance_id: number
  guild_id: string
  channel_id: string
  user_id: string
  created_at: string
}

export interface TrackedWar {
  id: number
  war_id: string
  alliance_id: number
  attacker_nation: string
  defender_nation: string
  war_date: string
  notified: boolean
  created_at: string
}

export class Database {
  private db: sqlite3.Database | null = null

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(process.env.DB_PATH || './valinor.db', (err) => {
        if (err) {
          reject(err)
          return
        }
        
        console.log('📁 Connected to SQLite database')
        this.createTables().then(resolve).catch(reject)
      })
    })
  }

  private async createTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS user_api_keys (
        user_id TEXT PRIMARY KEY,
        api_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS monitored_alliances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alliance_id INTEGER NOT NULL,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(alliance_id, guild_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS tracked_wars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        war_id TEXT NOT NULL,
        alliance_id INTEGER NOT NULL,
        attacker_nation TEXT NOT NULL,
        defender_nation TEXT NOT NULL,
        war_date DATETIME NOT NULL,
        notified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(war_id)
      )`,

      `CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        notification_channel_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    for (const query of queries) {
      await this.run(query)
    }
    
    console.log('✅ Database tables created/verified')
  }

  private async run(query: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      
      this.db.run(query, params, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  private async get(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      
      this.db.get(query, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  private async all(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async setUserApiKey(userId: string, apiKey: string): Promise<void> {
    await this.run(
      'INSERT OR REPLACE INTO user_api_keys (user_id, api_key) VALUES (?, ?)',
      [userId, apiKey]
    )
  }

  async getUserApiKey(userId: string): Promise<string | null> {
    const row = await this.get(
      'SELECT api_key FROM user_api_keys WHERE user_id = ?',
      [userId]
    )
    return row ? row.api_key : null
  }

  async addMonitoredAlliance(allianceId: number, guildId: string, channelId: string, userId: string): Promise<void> {
    await this.run(
      'INSERT OR REPLACE INTO monitored_alliances (alliance_id, guild_id, channel_id, user_id) VALUES (?, ?, ?, ?)',
      [allianceId, guildId, channelId, userId]
    )
  }

  async removeMonitoredAlliance(allianceId: number, guildId: string): Promise<void> {
    await this.run(
      'DELETE FROM monitored_alliances WHERE alliance_id = ? AND guild_id = ?',
      [allianceId, guildId]
    )
  }

  async getMonitoredAlliances(guildId?: string): Promise<MonitoredAlliance[]> {
    if (guildId) {
      return await this.all(
        'SELECT * FROM monitored_alliances WHERE guild_id = ?',
        [guildId]
      )
    } else {
      return await this.all('SELECT * FROM monitored_alliances')
    }
  }

  async addTrackedWar(warId: string, allianceId: number, attackerNation: string, defenderNation: string, warDate: string): Promise<void> {
    await this.run(
      'INSERT OR IGNORE INTO tracked_wars (war_id, alliance_id, attacker_nation, defender_nation, war_date) VALUES (?, ?, ?, ?, ?)',
      [warId, allianceId, attackerNation, defenderNation, warDate]
    )
  }

  async markWarAsNotified(warId: string): Promise<void> {
    await this.run(
      'UPDATE tracked_wars SET notified = TRUE WHERE war_id = ?',
      [warId]
    )
  }

  async getUnnotifiedWars(): Promise<TrackedWar[]> {
    return await this.all(
      'SELECT * FROM tracked_wars WHERE notified = FALSE ORDER BY war_date DESC'
    )
  }

  async getTrackedWarsForAlliance(allianceId: number): Promise<TrackedWar[]> {
    return await this.all(
      'SELECT * FROM tracked_wars WHERE alliance_id = ? ORDER BY war_date DESC LIMIT 50',
      [allianceId]
    )
  }

  async cleanup(): Promise<void> {
    // Remove wars older than 30 days
    await this.run(
      'DELETE FROM tracked_wars WHERE created_at < datetime("now", "-30 days")'
    )
  }

  // Additional methods for API integration
  async getGlobalConfig(): Promise<any> {
    // Return global bot configuration
    return {
      version: '1.0.0',
      monitoring_enabled: true,
      check_interval: 5 // minutes
    }
  }

  async setNotificationChannel(guildId: string, channelId: string): Promise<void> {
    // Update or create a default notification channel setting for a guild
    await this.run(
      `INSERT OR REPLACE INTO guild_settings (guild_id, notification_channel_id, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [guildId, channelId]
    )
  }

  async getNotificationChannel(guildId: string): Promise<string | null> {
    const row = await this.get(
      'SELECT notification_channel_id FROM guild_settings WHERE guild_id = ?',
      [guildId]
    )
    return row?.notification_channel_id || null
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }
      
      this.db.close((err) => {
        if (err) reject(err)
        else {
          console.log('📁 Database connection closed')
          resolve()
        }
      })
    })
  }
}
