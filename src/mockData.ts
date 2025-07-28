// Mock data for development when no API key is available
export const mockAllianceData = {
  alliances: {
    data: [
      {
        id: "10523",
        name: "Valinor",
        acronym: "VAL",
        score: 1250000,
        nations: [
          {
            id: "1",
            nation_name: "Nation Alpha",
            leader_name: "Leader Alpha",
            alliance_position: "Member",
            score: 25000,
            num_cities: 15,
            wars: {
              data: []
            }
          },
          {
            id: "2", 
            nation_name: "Nation Beta",
            leader_name: "Leader Beta", 
            alliance_position: "Member",
            score: 30000,
            num_cities: 18,
            wars: {
              data: [
                {
                  id: "war1",
                  date: new Date().toISOString(),
                  attacker: {
                    id: "999",
                    nation_name: "Enemy Nation",
                    alliance: {
                      name: "Enemy Alliance"
                    }
                  },
                  defender: {
                    id: "2",
                    nation_name: "Nation Beta",
                    alliance: {
                      name: "Valinor"
                    }
                  },
                  turns_left: 23
                }
              ]
            }
          },
          {
            id: "3",
            nation_name: "Nation Gamma", 
            leader_name: "Leader Gamma",
            alliance_position: "Officer",
            score: 45000,
            num_cities: 22,
            wars: {
              data: []
            }
          },
          {
            id: "4",
            nation_name: "Nation Delta",
            leader_name: "Leader Delta", 
            alliance_position: "Member",
            score: 18000,
            num_cities: 12,
            wars: {
              data: []
            }
          },
          {
            id: "5",
            nation_name: "Nation Echo",
            leader_name: "Leader Echo",
            alliance_position: "Member", 
            score: 35000,
            num_cities: 19,
            wars: {
              data: []
            }
          }
        ]
      }
    ]
  }
}

export const mockWarData = {
  wars: {
    data: [
      {
        id: "war1",
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        attacker: {
          id: "999",
          nation_name: "Aggressor Nation",
          alliance: {
            name: "Hostile Alliance"
          }
        },
        defender: {
          id: "2",
          nation_name: "Nation Beta",
          alliance: {
            name: "Valinor"
          }
        },
        turns_left: 23
      }
    ]
  }
}
