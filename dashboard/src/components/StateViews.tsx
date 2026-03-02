export function LoadingView({ text }: { text: string }) {
  return (
    <div className="state-view">
      <div className="loader" />
      <p>{text}</p>
    </div>
  );
}

export function ErrorView({ text }: { text: string }) {
  return (
    <div className="state-view error">
      <p>{text}</p>
    </div>
  );
}
