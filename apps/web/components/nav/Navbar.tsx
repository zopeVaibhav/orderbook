import Searchbar from '../searchbar/Searchbar';
import { Button } from '../ui/button';

export default function Navbar() {
    return (
        <div className="flex h-14 shrink-0 items-center gap-4 px-3">
            <div className="shrink-0 text-lg font-semibold">Orderbook</div>
            <div className="flex flex-1 justify-center">
                <Searchbar />
            </div>
            <Button className="shrink-0">Login</Button>
        </div>
    );
}
