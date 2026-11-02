import EmptyMessage from './EmptyMessage';

type Props = {
    columns: string;
    minWidth: string;
    header: React.ReactNode;
    empty?: string | null;
    children?: React.ReactNode;
};

export default function PanelTable({ columns, minWidth, header, empty, children }: Props) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div
                className={`no-scrollbar flex flex-col overflow-x-auto ${empty ? 'shrink-0' : 'min-h-0 flex-1'}`}
            >
                <div className={`flex min-h-0 flex-1 flex-col ${minWidth}`}>
                    <div
                        className={`${columns} h-8 shrink-0 border-b border-border uppercase tracking-wide text-muted-foreground/70`}
                    >
                        {header}
                    </div>
                    {!empty && (
                        <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {children}
                        </div>
                    )}
                </div>
            </div>
            {empty && <EmptyMessage>{empty}</EmptyMessage>}
        </div>
    );
}
