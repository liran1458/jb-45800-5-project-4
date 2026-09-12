import './Header.css'

export default function Header() {
    return (
        <header className="header">
            <div className="header__content">
                <p className="header__eyebrow">Chess ML Project</p>
                <h1>Chess Piece Classifier</h1>
                <p className="header__subtitle">
                    Upload a chess piece image and let the model identify it.
                </p>
            </div>
        </header>
    )
}
