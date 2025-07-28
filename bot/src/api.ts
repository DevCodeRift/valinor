import { GraphQLClient } from 'graphql-request'

export interface Nation {
  id: string
  nation_name: string
  leader_name: string
  alliance_id: string
  alliance_position: string
  score: number
  num_cities: number
  wars: War[]
}

export interface War {
  id: string
  date: string
  attacker: {
    id: string
    nation_name: string
    alliance: {
      id: string
      name: string
    } | null
  }
  defender: {
    id: string
    nation_name: string
    alliance: {
      id: string
      name: string
    } | null
  }
  turns_left: number
}

export interface Alliance {
  id: string
  name: string
  acronym: string
  score: number
  nations: Nation[]
}

export class PoliticsAndWarAPI {
  private client: GraphQLClient

  constructor() {
    // We'll set the API key dynamically via URL parameters
    this.client = new GraphQLClient('https://api.politicsandwar.com/graphql')
  }

  private getClientWithApiKey(apiKey: string): GraphQLClient {
    return new GraphQLClient(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`)
  }

  async getAllianceInfo(allianceId: number, apiKey: string): Promise<Alliance> {
    const client = this.getClientWithApiKey(apiKey)
    
    const query = `
      query GetAllianceInfo($id: [Int!]) {
        alliances(id: $id) {
          data {
            id
            name
            acronym
            score
            nations {
              id
              nation_name
              leader_name
              alliance_id
              alliance_position
              score
              num_cities
            }
          }
        }
      }
    `

    const variables = { id: [allianceId] }
    const data: any = await client.request(query, variables)
    
    if (!data.alliances?.data?.[0]) {
      throw new Error(`Alliance with ID ${allianceId} not found`)
    }
    
    return data.alliances.data[0]
  }

  async getAllianceWars(allianceId: number, apiKey: string, activeOnly: boolean = true): Promise<War[]> {
    const client = this.getClientWithApiKey(apiKey)
    
    const query = `
      query GetAllianceWars($allianceId: [Int!], $active: Boolean) {
        wars(alliance_id: $allianceId, active: $active, first: 100) {
          data {
            id
            date
            turns_left
            attacker {
              id
              nation_name
              alliance {
                id
                name
              }
            }
            defender {
              id
              nation_name
              alliance {
                id
                name
              }
            }
          }
        }
      }
    `

    const variables = { 
      allianceId: [allianceId], 
      active: activeOnly 
    }
    
    const data: any = await client.request(query, variables)
    return data.wars?.data || []
  }

  async getRecentWars(sinceDate: string, apiKey: string): Promise<War[]> {
    const client = this.getClientWithApiKey(apiKey)
    
    const query = `
      query GetRecentWars($after: DateTime) {
        wars(after: $after, first: 100) {
          data {
            id
            date
            turns_left
            attacker {
              id
              nation_name
              alliance {
                id
                name
              }
            }
            defender {
              id
              nation_name
              alliance {
                id
                name
              }
            }
          }
        }
      }
    `

    const variables = { after: sinceDate }
    const data: any = await client.request(query, variables)
    return data.wars?.data || []
  }

  async getNationInfo(nationId: number, apiKey: string): Promise<Nation> {
    const client = this.getClientWithApiKey(apiKey)
    
    const query = `
      query GetNationInfo($id: [Int!]) {
        nations(id: $id) {
          data {
            id
            nation_name
            leader_name
            alliance_id
            alliance_position
            score
            num_cities
            wars(limit: 10, active: true) {
              id
              date
              turns_left
              attacker {
                id
                nation_name
                alliance {
                  id
                  name
                }
              }
              defender {
                id
                nation_name
                alliance {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `

    const variables = { id: [nationId] }
    const data: any = await client.request(query, variables)
    
    if (!data.nations?.data?.[0]) {
      throw new Error(`Nation with ID ${nationId} not found`)
    }
    
    return data.nations.data[0]
  }

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = this.getClientWithApiKey(apiKey)
      
      const query = `
        query TestQuery {
          nations(first: 1) {
            data {
              id
              nation_name
            }
          }
        }
      `
      
      await client.request(query)
      return true
    } catch (error) {
      console.error('API key test failed:', error)
      return false
    }
  }
}
