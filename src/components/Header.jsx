import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <h1>
        <Link to="/">SSR Editor</Link>
      </h1>
    </header>
  );
}
