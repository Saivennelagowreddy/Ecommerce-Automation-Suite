import { Link } from "wouter";
import { MAIN_NAVIGATION, SYSTEM_NAVIGATION } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  currentPath: string;
}

const Sidebar = ({ isOpen, currentPath }: SidebarProps) => {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block bg-white w-64 shadow-md z-10 flex-shrink-0 transition-all duration-300">
        <SidebarContent currentPath={currentPath} />
      </aside>
      
      {/* Mobile sidebar - conditionally shown */}
      <aside 
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-64 bg-white shadow-lg z-40 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300`}
      >
        <SidebarContent currentPath={currentPath} />
      </aside>
    </>
  );
};

interface SidebarContentProps {
  currentPath: string;
}

const SidebarContent = ({ currentPath }: SidebarContentProps) => {
  return (
    <nav className="py-4">
      <div className="px-6 pb-4 border-b border-neutral-100">
        <div className="text-neutral-400 uppercase text-xs font-medium tracking-wider">Main</div>
      </div>
      
      <ul className="mt-4">
        {MAIN_NAVIGATION.map((item) => (
          <li key={item.path} className="px-2">
            <Link href={item.path}>
              <a 
                className={`flex items-center py-3 px-4 rounded ${
                  currentPath === item.path 
                    ? 'text-primary bg-blue-50 font-medium' 
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                <span className="material-icons mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="px-6 py-4 mt-4 border-t border-b border-neutral-100">
        <div className="text-neutral-400 uppercase text-xs font-medium tracking-wider">System</div>
      </div>
      
      <ul className="mt-4">
        {SYSTEM_NAVIGATION.map((item) => (
          <li key={item.path} className="px-2">
            <Link href={item.path}>
              <a 
                className={`flex items-center py-3 px-4 rounded ${
                  currentPath === item.path 
                    ? 'text-primary bg-blue-50 font-medium' 
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                <span className="material-icons mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
