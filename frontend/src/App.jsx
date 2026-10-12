/**
 * Path: frontend/src/App.jsx
 * Responsibility: Route owner, cashier and customer to separate protected workspaces.
 * Integration: AuthProvider, CartProvider, existing Part 1/2 pages and new customer flows.
 */
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth, roleHome } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import RequireRole from './components/RequireRole.jsx';
import WorkspaceLayout from './components/WorkspaceLayout.jsx';
import CustomerLayout from './components/CustomerLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderEditorPage from './pages/OrderEditorPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import BillsPage from './pages/BillsPage.jsx';
import InvoicePage from './pages/InvoicePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import CustomerMenuPage from './pages/CustomerMenuPage.jsx';
import CustomerCartPage from './pages/CustomerCartPage.jsx';
import CustomerOrdersPage from './pages/CustomerOrdersPage.jsx';
import CustomerProfilePage from './pages/CustomerProfilePage.jsx';
import { Loading } from './components/Feedback.jsx';

function HomeRedirect() {
  const { ready, user } = useAuth();
  if (!ready) return <main className="p-8"><Loading/></main>;
  return <Navigate to={user ? roleHome(user.role) : '/customer/menu'} replace/>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><CartProvider><Routes>
    <Route path="/" element={<HomeRedirect/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/signup" element={<SignupPage/>}/>
    <Route path="/customer" element={<CustomerLayout/>}>
      <Route index element={<Navigate to="menu" replace/>}/>
      <Route path="menu" element={<CustomerMenuPage/>}/>
      <Route path="cart" element={<CustomerCartPage/>}/>
      <Route element={<RequireRole roles={['CUSTOMER']}/> }>
        <Route path="orders" element={<CustomerOrdersPage/>}/>
        <Route path="profile" element={<CustomerProfilePage/>}/>
        <Route path="bills/:id" element={<InvoicePage/>}/>
      </Route>
    </Route>
    <Route element={<RequireRole roles={['OWNER']}/> }>
      <Route path="/owner" element={<WorkspaceLayout/>}>
        <Route index element={<DashboardPage/>}/>
        <Route path="menu" element={<MenuPage/>}/>
        <Route path="orders" element={<OrdersPage/>}/>
        <Route path="orders/new" element={<OrderEditorPage/>}/>
        <Route path="orders/:id/edit" element={<OrderEditorPage/>}/>
        <Route path="orders/:id/bill" element={<BillingPage/>}/>
        <Route path="bills" element={<BillsPage/>}/>
        <Route path="bills/:id" element={<InvoicePage/>}/>
        <Route path="reports" element={<ReportsPage/>}/>
      </Route>
    </Route>
    <Route element={<RequireRole roles={['CASHIER']}/> }>
      <Route path="/cashier" element={<WorkspaceLayout/>}>
        <Route index element={<Navigate to="orders" replace/>}/>
        <Route path="orders" element={<OrdersPage/>}/>
        <Route path="orders/new" element={<OrderEditorPage/>}/>
        <Route path="orders/:id/edit" element={<OrderEditorPage/>}/>
        <Route path="orders/:id/bill" element={<BillingPage/>}/>
        <Route path="bills" element={<BillsPage/>}/>
        <Route path="bills/:id" element={<InvoicePage/>}/>
      </Route>
    </Route>
    <Route path="*" element={<HomeRedirect/>}/>
  </Routes></CartProvider></AuthProvider></BrowserRouter>;
}
