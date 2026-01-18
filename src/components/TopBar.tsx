import { Search, Bell, User } from 'lucide-react';
import { Button } from './Button';

export function TopBar() {
    return (
        <header className="h-14 flex items-center justify-between px-6 shrink-0 z-50 relative">
            {/* Left: Window Controls (Decorative) */}
            <div className="flex items-center gap-2 w-48">
                <div className="flex gap-2 group">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-sm group-hover:opacity-80 transition-opacity" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] shadow-sm group-hover:opacity-80 transition-opacity" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] shadow-sm group-hover:opacity-80 transition-opacity" />
                </div>
            </div>

            {/* Center: App Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none">
                <span className="text-sm font-semibold text-theme-text opacity-90 tracking-tight">Retail POS Pro</span>
            </div>

            {/* Right: Search & Profile */}
            <div className="flex items-center gap-4 w-48 justify-end">
                <div className="relative group">
                    <Search className="w-4 h-4 text-theme-text-secondary absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-mac-blue transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-1.5 w-48 text-sm input-mac rounded-full focus:w-64 transition-all duration-300 shadow-sm"
                    />
                </div>

                <button className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center hover:bg-white/80 transition-all shadow-sm border border-white/40">
                    <Bell className="w-4 h-4 text-theme-text-secondary" />
                </button>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-mac-blue to-mac-pink p-[2px] shadow-sm cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <User className="w-4 h-4 text-theme-text" />
                    </div>
                </div>
            </div>
        </header>
    );
}
