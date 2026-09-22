import {Navigate, Route, Routes} from 'react-router'
import {AppShell} from './components/AppShell/AppShell'
import {CategoriesPage} from './features/categories/CategoriesPage'
import {TransactionsPage} from './features/transactions/TransactionsPage'
import {ThresholdsPage} from './features/thresholds/ThresholdsPage'
import {PagePlaceholder} from './features/placeholder/PagePlaceholder'

function App() {
    return (
        <AppShell>
            <Routes>
                <Route path="/" element={<Navigate to="/transactions" replace/>}/>
                <Route path="/overview" element={<PagePlaceholder title="Overview"/>}/>
                <Route path="/transactions" element={<TransactionsPage/>}/>
                <Route path="/categories" element={<CategoriesPage/>}/>
                <Route path="/thresholds" element={<ThresholdsPage/>}/>
                <Route path="/settings" element={<PagePlaceholder title="Settings"/>}/>
            </Routes>
        </AppShell>
    )
}

export default App
