import Header from '../Header/Header'
import Main from '../Main/Main'
import Footer from '../Footer/Footer'
import './Layout.css'

export default function Layout() {
    return (
        <div className="layout">
            <Header />
            <Main />
            <Footer />
        </div>
    )
}
