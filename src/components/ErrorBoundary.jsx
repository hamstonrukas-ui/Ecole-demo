import React from "react";

// Filet de sécurité : si un écran plante au rendu (erreur JS), affiche le
// message d'erreur directement sur la page — plus jamais un "rien ne se
// passe" silencieux, ni besoin d'un ordinateur/console pour diagnostiquer.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-red-50 p-6">
          <div className="max-w-md mx-auto bg-white border border-red-300 rounded-2xl p-5">
            <p className="font-black text-red-700 mb-2">Une erreur a empêché cet écran de s'afficher</p>
            <p className="text-sm text-red-600 font-mono whitespace-pre-wrap break-all mb-3">
              {this.state.error?.message || String(this.state.error)}
            </p>
            {this.state.info?.componentStack && (
              <details className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap break-all">
                <summary className="cursor-pointer text-slate-500 font-sans text-xs mb-1">Détails techniques</summary>
                {this.state.info.componentStack}
              </details>
            )}
            <button
              onClick={() => this.setState({ error: null, info: null })}
              className="mt-4 w-full bg-sky-500 text-white font-bold py-2.5 rounded-xl"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
                    }
          
