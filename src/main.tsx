import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import App from './App.tsx'
import './index.css'

// Apollo Client setup for Politics and War API
const httpLink = createHttpLink({
  uri: () => {
    const apiKey = localStorage.getItem('pw_api_key')
    return apiKey 
      ? `https://api.politicsandwar.com/graphql?api_key=${apiKey}`
      : 'https://api.politicsandwar.com/graphql'
  },
})

const authLink = setContext((_, { headers }) => {
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    }
  }
})

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
)
