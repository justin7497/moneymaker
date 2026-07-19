import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { HomePage } from "./pages/HomePage";
import { NaverBrandConnectPage } from "./pages/NaverBrandConnectPage";

export default function App() {
  return (
    <BrowserRouter
      basename={
        import.meta.env.BASE_URL === "/"
          ? undefined
          : import.meta.env.BASE_URL.replace(/\/$/, "")
      }
    >
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="naver-brand-connect" element={<NaverBrandConnectPage />} />
          <Route
            path="instagram"
            element={
              <ComingSoonPage
                title="인스타그램"
                description="쇼핑 콘텐츠용 캡션·해시태그 포맷"
              />
            }
          />
          <Route
            path="youtube"
            element={
              <ComingSoonPage
                title="유튜브"
                description="숏폼·리뷰 스크립트 포맷"
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
