import Searchbar from '../searchbar/Searchbar';

export default function Navbar() {
    return (
        <div className="flex h-14 shrink-0 items-center justify-between px-3">
            <div className="flex items-center gap-6">
                <div>Orderbook</div>
                <div className="flex items-center gap-4">
                    <div>Discover</div>
                    <div>Tokens</div>
                    <div>Perps</div>
                    <div>Portfolio</div>
                </div>
            </div>
            <div className="flex-1 px-8">
                <Searchbar />
            </div>
            <div>Login</div>
        </div>
    );
}
