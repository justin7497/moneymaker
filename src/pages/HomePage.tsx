import { Link } from "react-router-dom";
import { channels } from "../channels";

export function HomePage() {
  return (
    <div className="app">
      <header className="header">
        <h1>돈버는 앱</h1>
        <p>채널별 콘텐츠로 수익을 만드세요.</p>
      </header>

      <section className="channel-grid" aria-label="돈버는 메뉴">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            to={channel.path}
            className={`channel-card ${channel.status === "soon" ? "soon" : ""}`}
          >
            <div className="channel-card-top">
              <h2>{channel.title}</h2>
              <span className={`badge ${channel.status}`}>
                {channel.status === "ready" ? "사용 가능" : "준비 중"}
              </span>
            </div>
            <p>{channel.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
