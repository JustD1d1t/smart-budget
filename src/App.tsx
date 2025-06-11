import { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { useUserStore } from "./stores/userStore";

// Pages
import ExpensesEditPage from "./pages/expenses/ExpenseEditPage";
import ExpensesListPage from "./pages/expenses/ExpensesListPage";
import ExpensesNewPage from "./pages/expenses/ExpensesNewPage";
import Login from "./pages/Login";
import PantryDetailsPage from "./pages/pantries/PantryDetailsPage";
import PantryListPage from "./pages/pantries/PantryListPage";
import NewRecipePage from "./pages/recipes/NewRecipePage";
import RecipeDetailsPage from "./pages/recipes/RecipeDetailsPage";
import RecipesListPage from "./pages/recipes/RecipesListPage";
import Register from "./pages/Register";
import ShoppingListDetailsPage from "./pages/shopping-lists/ShoppingListDetailsPage";
import ShoppingLists from "./pages/shopping-lists/ShoppingListsPage";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  // 🔐 Obsługa sesji Supabase po odświeżeniu
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      useUserStore.getState().setUser(session?.user ?? null, session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      useUserStore.getState().setUser(session?.user ?? null, session ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const { user, clearUser } = useUserStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow flex items-center justify-between">
        {user ? (
          <div className="flex gap-4">
            <NavLink to="/">Listy zakupowe</NavLink>
            <NavLink to="/recipes">Przepisy</NavLink>
            <NavLink to="/expenses">Wydatki</NavLink>
            <NavLink to="/pantry">Spiżarnia</NavLink>
          </div>
        ) : <div />}

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <NavLink to="/login">Logowanie</NavLink>
              <NavLink to="/register">Rejestracja</NavLink>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <button onClick={handleLogout} className="text-red-500">
                Wyloguj się
              </button>
            </>
          )}
        </div>
      </nav>


      <main className="p-6 max-w-4xl mx-auto">
        <Routes>
          {/* public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* prywatne */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ShoppingLists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping-lists/:id"
            element={
              <ProtectedRoute>
                <ShoppingListDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <RecipesListPage />
              </ProtectedRoute>
            }
          />

          <Route path="/recipes/new" element={
            <ProtectedRoute>
              <NewRecipePage />
            </ProtectedRoute>
          } />
          <Route path="/recipes/:id" element={<RecipeDetailsPage />} />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpensesListPage />
              </ProtectedRoute>
            }
          />
          <Route path="/expenses/new" element={
            <ProtectedRoute>
              <ExpensesNewPage />
            </ProtectedRoute>
          } />
          <Route path="/expenses/edit/:id" element={
            <ProtectedRoute>
              <ExpensesEditPage />
            </ProtectedRoute>
          } />
          <Route path="/pantry" element={<ProtectedRoute><PantryListPage /></ProtectedRoute>} />
          <Route path="/pantries/:id" element={<ProtectedRoute><PantryDetailsPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
