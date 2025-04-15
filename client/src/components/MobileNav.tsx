import { Link } from "wouter";
import { MAIN_NAVIGATION } from "@/types";

interface MobileNavProps {
  currentPath: string;
}

const MobileNav = ({ currentPath }: MobileNavProps) => {
  // Use only the first 4 navigation items for the mobile bottom nav
  const mobileNavItems = [...MAIN_NAVIGATION];
  if (mobileNavItems.length > 4) {
    mobileNavItems.length = 4;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-20">
      <div className="flex justify-around">
        {mobileNavItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a 
              className={`flex flex-col items-center py-2 px-3 ${
                currentPath === item.path ? 'text-primary' : 'text-neutral-400'
              }`}
            >
              <span className="material-icons">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
        
        {/* More button - always included */}
        <Link href="/more">
          <a 
            className={`flex flex-col items-center py-2 px-3 ${
              currentPath === '/more' ? 'text-primary' : 'text-neutral-400'
            }`}
          >
            <span className="material-icons">more_horiz</span>
            <span className="text-xs mt-1">More</span>
          </a>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNav;
