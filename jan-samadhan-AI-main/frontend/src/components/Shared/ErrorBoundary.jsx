import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
          <div className="mx-auto mt-16 max-w-2xl rounded border border-red-400/30 bg-red-500/10 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-red-200">Frontend error</p>
            <h1 className="mt-2 text-2xl font-black">The page could not render.</h1>
            <pre className="mt-4 overflow-auto rounded bg-slate-950 p-4 text-sm text-red-100">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
