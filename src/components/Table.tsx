import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    className?: string;
    emptyMessage?: string;
    isLoading?: boolean;
}

export function Table<T extends { id: number | string }>({
    data,
    columns,
    onRowClick,
    className = "",
    emptyMessage = "No items found",
    isLoading = false
}: TableProps<T>) {

    // Inline Styles for Glass Table
    const tableContainerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };

    const headerCellStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'rgba(255, 255, 255, 0.5)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10
    };

    const rowStyle: React.CSSProperties = {
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: onRowClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
        color: 'white',
        fontSize: '14px',
        background: 'transparent' // Explicitly transparent
    };

    const cellStyle: React.CSSProperties = {
        padding: '12px 16px',
        whiteSpace: 'nowrap'
    };

    return (
        <div style={tableContainerStyle} className={className}>
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} style={{ ...headerCellStyle, textAlign: col.className?.includes('right') ? 'right' : col.className?.includes('center') ? 'center' : 'left' }}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '80px 0', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                        <Loader2 size={24} className="animate-spin" />
                                        <span style={{ fontSize: '12px', fontWeight: 500 }}>Loading...</span>
                                    </div>
                                    <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                </td>
                            </tr>
                        ) : data.length > 0 ? (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick?.(item)}
                                    // React Mouse Events for Hover Effect
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    style={rowStyle}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} style={{ ...cellStyle, textAlign: col.className?.includes('right') ? 'right' : col.className?.includes('center') ? 'center' : 'left' }}>
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '96px 0', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px', fontWeight: 500 }}>
                                            {emptyMessage}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
