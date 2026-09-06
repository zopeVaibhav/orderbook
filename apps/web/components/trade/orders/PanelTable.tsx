import EmptyMessage from './EmptyMessage';

type Props = {
    columns: string;
    header: React.ReactNode;
    empty?: string | null;
    children?: React.ReactNode;
};

export default function PanelTable({ columns, header, empty, children }: Props) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div
                className={`${columns} h-8 shrink-0 border-b border-border uppercase tracking-wide text-muted-foreground/70`}
            >
                {header}
            </div>
            <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {empty ? <EmptyMessage>{empty}</EmptyMessage> : children}
            </div>
        </div>
    );
}
