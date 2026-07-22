import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { VolumeControl } from './VolumeControl';
import { SoundToggle } from './SoundToggle';
import { useAuthStore } from '../stores/useAuthStore';
export function Layout({ children }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    return (_jsxs("div", { className: "app-layout", children: [_jsx("header", { className: "app-header", children: _jsxs("div", { className: "header-content", children: [_jsxs(Link, { to: "/", className: "app-logo", children: [_jsxs("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 6v6l4 2" })] }), _jsx("span", { className: "app-name", children: "Chess Review" })] }), _jsxs("div", { className: "header-right", children: [_jsxs("nav", { className: "app-nav", children: [_jsx(Link, { to: "/", className: `nav-link ${isActive('/') ? 'active' : ''}`, children: "Home" }), _jsx(Link, { to: "/my-games", className: `nav-link ${isActive('/my-games') ? 'active' : ''}`, children: "My Games" })] }), _jsxs("div", { className: "sound-controls", children: [_jsx(SoundToggle, {}), _jsx(VolumeControl, {}), useAuthStore((s) => s.user) && (_jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => useAuthStore.getState().signOut(), style: { marginLeft: '1rem' }, children: "Log Out" }))] })] })] }) }), _jsx("main", { className: "app-main", children: children })] }));
}
