import { BrowserRouter, Routes, Route } from "react-router-dom";
import BarreNavigation from "./components/BarreNavigation";
import InstallPrompt from "./components/InstallPrompt";
import InstallButton from "./components/InstallButton";
import { CartProvider } from "./context/CartContext";

// Accueil
import Accueil from "./pages/Accueil";

// Boutique
import CategoriesBoutique from "./pages/Boutique/CategoriesBoutique";
import ListeBoutiquesCategorie from "./pages/Boutique/ListeBoutiquesCategorie";
import BoutiqueLayout from "./pages/Boutique/BoutiqueLayout";
import Catalogue from "./pages/Boutique/Catalogue";
import Panier from "./pages/Boutique/Panier";
import Commande from "./pages/Boutique/Commande";
import Avis from "./pages/Boutique/Avis";
import Parrainage from "./pages/Boutique/Parrainage";
import Nouveautes from "./pages/Boutique/Nouveautes";
import CreerBoutique from "./pages/Boutique/CreerBoutique";
import GererBoutique from "./pages/Boutique/GererBoutique";
import DetailProduit from "./pages/Boutique/DetailProduit";
import RechercheBoutique from "./pages/Boutique/Recherche";

// Location
import LocationAccueil from "./pages/Location/Accueil";
import RechercheLocation from "./pages/Location/Recherche";
import Fiche from "./pages/Location/Fiche";
import FavorisLocation from "./pages/Location/Favoris";
import Publier from "./pages/Location/Publier";

// Requête
import ListeRequetes from "./pages/Requete/ListeRequetes";
import PublierRequete from "./pages/Requete/PublierRequete";
import DetailRequete from "./pages/Requete/DetailRequete";

// Auth
import Connexion from "./pages/Auth/Connexion";
import Inscription from "./pages/Auth/Inscription";
import MotDePasseOublie from "./pages/Auth/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/Auth/ReinitialiserMotDePasse";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F3F3F3] flex flex-col max-w-6xl mx-auto">
      <div className="flex-1 pb-20">{children}</div>
      <BarreNavigation />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <InstallPrompt />
        <InstallButton />
        <Routes>
          {/* Accueil */}
          <Route path="/" element={<AppLayout><Accueil /></AppLayout>} />

          {/* Boutique — découverte par catégorie */}
          <Route path="/boutique" element={<AppLayout><CategoriesBoutique /></AppLayout>} />
          <Route path="/boutique/categorie/:categorieId" element={<AppLayout><ListeBoutiquesCategorie /></AppLayout>} />
          <Route path="/boutique/creer" element={<AppLayout><CreerBoutique /></AppLayout>} />
          <Route path="/boutique/gerer" element={<AppLayout><GererBoutique /></AppLayout>} />
          <Route path="/boutique/recherche" element={<AppLayout><RechercheBoutique /></AppLayout>} />
          <Route path="/boutique/produit/:id" element={<AppLayout><DetailProduit /></AppLayout>} />

          {/* Boutique — mini-site d'une boutique précise */}
          <Route path="/boutique/:id" element={<AppLayout><BoutiqueLayout /></AppLayout>}>
            <Route index element={<Catalogue />} />
            <Route path="panier" element={<Panier />} />
            <Route path="commande" element={<Commande />} />
            <Route path="avis" element={<Avis />} />
            <Route path="parrainage" element={<Parrainage />} />
            <Route path="nouveautes" element={<Nouveautes />} />
          </Route>

          {/* Location */}
          <Route path="/location" element={<AppLayout><LocationAccueil /></AppLayout>} />
          <Route path="/location/recherche" element={<AppLayout><RechercheLocation /></AppLayout>} />
          <Route path="/location/maison/:id" element={<AppLayout><Fiche /></AppLayout>} />
          <Route path="/location/favoris" element={<AppLayout><FavorisLocation /></AppLayout>} />
          <Route path="/location/publier" element={<AppLayout><Publier /></AppLayout>} />

          {/* Requête */}
          <Route path="/requete" element={<AppLayout><ListeRequetes /></AppLayout>} />
          <Route path="/requete/publier" element={<AppLayout><PublierRequete /></AppLayout>} />
          <Route path="/requete/:id" element={<AppLayout><DetailRequete /></AppLayout>} />

          {/* Auth */}
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
