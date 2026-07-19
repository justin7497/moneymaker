type Props = {
  title: string;
  description: string;
};

export function ComingSoonPage({ title, description }: Props) {
  return (
    <div className="app">
      <header className="header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section className="panel">
        <h2>준비 중</h2>
        <p className="muted">
          네이버 브랜드커넥트 포맷을 먼저 안정화한 뒤 이 채널 연동을
          추가할 예정입니다.
        </p>
      </section>
    </div>
  );
}
