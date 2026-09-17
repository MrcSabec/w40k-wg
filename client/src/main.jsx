import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CRITICAL ERROR CAUGHT BY BOUNDARY:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset() {
    localStorage.clear();
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-grim-950 text-grim-200 flex items-center justify-center p-6 font-body">
          <div className="max-w-xl w-full bg-grim-900 border-2 border-red-600 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-grim-800 pb-3">
              <div className="w-10 h-10 rounded bg-red-900/80 border border-red-500 flex items-center justify-center text-red-300 font-bold text-xl">
                ⚠️
              </div>
              <div>
                <h2 className="font-gothic font-bold text-lg text-red-400 uppercase tracking-wide">
                  Anomalia no Cogitador Central (Erro)
                </h2>
                <span className="text-[10px] text-grim-400 font-tech">SISTEMA REQUER REINICIALIZAÇÃO</span>
              </div>
            </div>

            <p className="text-xs text-grim-300">
              Ocorreu uma exceção inesperada durante a renderização do terminal:
            </p>

            <div className="bg-grim-950 p-3 rounded border border-grim-800 font-tech text-xs text-rose-400 overflow-x-auto">
              {this.state.error?.toString()}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-grim-800 hover:bg-grim-700 text-grim-200 text-xs font-bold uppercase rounded border border-grim-700"
              >
                Tentar Novamente
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-gothic font-bold text-xs uppercase rounded shadow"
              >
                Limpar Cache e Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
