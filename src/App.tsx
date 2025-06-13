import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { useUserStore } from "./stores/userStore";

// Pages (tak jak u Ciebie)
import ProtectedRoute from "./components/ProtectedRoute";
import ExpensesEditPage from "./pages/expenses/ExpenseEditPage";
import ExpensesListPage from "./pages/expenses/ExpensesListPage";
import ExpensesNewPage from "./pages/expenses/ExpensesNewPage";
import FriendsPage from "./pages/friends/FriendsPage";
import Login from "./pages/Login";
import PantryDetailsPage from "./pages/pantries/PantryDetailsPage";
import PantryListPage from "./pages/pantries/PantryListPage";
import NewRecipePage from "./pages/recipes/NewRecipePage";
import RecipeDetailsPage from "./pages/recipes/RecipeDetailsPage";
import RecipesListPage from "./pages/recipes/RecipesListPage";
import Register from "./pages/Register";
import ShoppingListDetailsPage from "./pages/shopping-lists/ShoppingListDetailsPage";
import ShoppingLists from "./pages/shopping-lists/ShoppingListsPage";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Obsługa sesji Supabase
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

  // Po kliknięciu linku zamykamy menu na mobile
  const handleNavClick = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow flex items-center justify-between relative z-20">
        {/* Hamburger button - widoczny tylko na mobile */}
        {user && (
          <button
            className="lg:hidden p-2 mr-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className="block w-6 h-0.5 bg-gray-800 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-800 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-800"></span>
          </button>
        )}

        {/* Menu desktop */}
        {user ? (
          <div className="gap-4 hidden lg:flex">
            <NavLink to="/" className="px-2 py-1" onClick={handleNavClick}>Listy zakupowe</NavLink>
            <NavLink to="/recipes" className="px-2 py-1" onClick={handleNavClick}>Przepisy</NavLink>
            <NavLink to="/expenses" className="px-2 py-1" onClick={handleNavClick}>Wydatki</NavLink>
            <NavLink to="/pantry" className="px-2 py-1" onClick={handleNavClick}>Spiżarnia</NavLink>
            <NavLink to="/friends" className="px-2 py-1" onClick={handleNavClick}>Znajomi</NavLink>
          </div>
        ) : <div />}

        {/* Prawa część (login/user) */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <NavLink to="/login" className="px-2 py-1">Logowanie</NavLink>
              <NavLink to="/register" className="px-2 py-1">Rejestracja</NavLink>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
              <button onClick={handleLogout} className="text-red-500">Wyloguj się</button>
            </>
          )}
        </div>

        {/* Menu mobile (offcanvas) */}
        {user && (
          <div className={`fixed inset-0 z-30 transition-all ${menuOpen ? "block" : "hidden"} lg:hidden`}>
            {/* Tło */}
            <div
              className="absolute inset-0 bg-black bg-opacity-40"
              onClick={() => setMenuOpen(false)}
            />
            {/* Panel menu */}
            <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg p-6 flex flex-col gap-6">
              <button
                className="mb-6 self-end text-2xl font-bold"
                onClick={() => setMenuOpen(false)}
                aria-label="Zamknij menu"
              >
                &times;
              </button>
              <NavLink to="/" className="block py-2 px-3 text-lg" onClick={handleNavClick}>Listy zakupowe</NavLink>
              <NavLink to="/recipes" className="block py-2 px-3 text-lg" onClick={handleNavClick}>Przepisy</NavLink>
              <NavLink to="/expenses" className="block py-2 px-3 text-lg" onClick={handleNavClick}>Wydatki</NavLink>
              <NavLink to="/pantry" className="block py-2 px-3 text-lg" onClick={handleNavClick}>Spiżarnia</NavLink>
              <NavLink to="/friends" className="block py-2 px-3 text-lg" onClick={handleNavClick}>Znajomi</NavLink>
              <div className="border-t pt-4 mt-auto">
                <span className="block mb-2 text-gray-700 text-sm">{user.email}</span>
                <button onClick={handleLogout} className="text-red-500 w-full text-left">
                  Wyloguj się
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="p-3 sm:p-6 max-w-4xl mx-auto">
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
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
