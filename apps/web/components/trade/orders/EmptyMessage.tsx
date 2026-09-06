export default function EmptyMessage({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}
