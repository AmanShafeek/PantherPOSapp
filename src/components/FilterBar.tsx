import { Search, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

export type FilterType = 'all' | 'low_stock' | 'out_of_stock';
export type SortType = 'name_asc' | 'price_desc' | 'stock_asc';

interface FilterBarProps {
    search: string;
    onSearchChange: (val: string) => void;
    activeFilter: FilterType;
    onFilterChange: (val: FilterType) => void;
    activeSort: SortType;
    onSortChange: (val: SortType) => void;
}

export function FilterBar({
    search, onSearchChange,
    activeFilter, onFilterChange,
    activeSort, onSortChange
}: FilterBarProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            {/* Search Input */}
            <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
                    <Search size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginLeft: '16px' }} />
                    <input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search products..."
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            padding: '12px 16px',
                            fontSize: '14px',
                            color: 'white',
                            outline: 'none',
                            fontWeight: 500
                        }}
                    />
                </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.2)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', gap: '4px' }}>
                {[
                    { id: 'all', label: 'All Items' },
                    { id: 'low_stock', label: 'Low Stock' },
                    { id: 'out_of_stock', label: 'Out of Stock' }
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id as FilterType)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            background: activeFilter === filter.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            color: activeFilter === filter.id ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            boxShadow: activeFilter === filter.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Sort Dropdown */}
            <div style={{ position: 'relative' }}>
                <select
                    value={activeSort}
                    onChange={(e) => onSortChange(e.target.value as SortType)}
                    style={{
                        appearance: 'none',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '12px 16px',
                        paddingRight: '40px',
                        borderRadius: '12px',
                        outline: 'none',
                        cursor: 'pointer',
                        minWidth: '160px'
                    }}
                >
                    <option value="name_asc" style={{ background: '#333' }}>Name (A-Z)</option>
                    <option value="price_desc" style={{ background: '#333' }}>Price (High-Low)</option>
                    <option value="stock_asc" style={{ background: '#333' }}>Stock (Low-High)</option>
                    <option value="stock_desc" style={{ background: '#333' }}>Stock (High-Low)</option>
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <ArrowUpDown size={16} color="rgba(255, 255, 255, 0.5)" />
                </div>
            </div>
        </div>
    );
}
