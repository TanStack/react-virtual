/* @refresh reload */
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { render } from 'solid-js/web'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

const root = document.getElementById('root')

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  ),
  root!,
)
