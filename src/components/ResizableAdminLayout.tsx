import { ReactNode } from 'react';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface ResizableAdminLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function ResizableAdminLayout({ sidebar, children }: ResizableAdminLayoutProps) {
  const { open, isMobile } = useSidebar();

  // On mobile, don't use resizable panels (use sidebar's built-in sheet)
  if (isMobile) {
    return (
      <>
        {sidebar}
        {children}
      </>
    );
  }

  // On desktop, use resizable panels
  // When sidebar is closed, hide the resizable panel and sidebar completely
  if (!open) {
    return (
      <div className="w-full h-full overflow-hidden flex flex-col">
        <div className="hidden">{sidebar}</div>
        <div className="flex-1 h-full overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .resizable-sidebar-container {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          overflow: hidden !important;
        }
        .resizable-sidebar-container > div {
          height: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
        }
        .resizable-sidebar-container .group.peer {
          height: 100% !important;
          max-height: 100% !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .resizable-sidebar-container .group.peer > div:first-child {
          height: 0 !important;
          max-height: 0 !important;
          flex-shrink: 0 !important;
        }
        .resizable-sidebar-container .fixed {
          position: relative !important;
          left: auto !important;
          right: auto !important;
          top: auto !important;
          bottom: auto !important;
          width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          flex: 1 1 auto !important;
          padding: 0 !important;
        }
        .resizable-sidebar-container .fixed.p-2 {
          padding: 0 !important;
        }
        .resizable-sidebar-container [data-sidebar="sidebar"] {
          position: relative !important;
          height: 100% !important;
          max-height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .resizable-sidebar-container [data-sidebar="sidebar"].bg-sidebar {
          background: transparent !important;
        }
        .resizable-sidebar-container [data-variant="floating"] [data-sidebar="sidebar"] {
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
        .resizable-sidebar-container [data-sidebar="content"] {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        .resizable-sidebar-container [data-sidebar="footer"] {
          flex-shrink: 0 !important;
          margin-top: auto !important;
        }
      `}</style>
      <ResizablePanelGroup direction="horizontal" className="h-screen">
        <ResizablePanel 
          defaultSize={20} 
          minSize={15} 
          maxSize={40}
          className="relative overflow-hidden resizable-sidebar-container"
        >
          <div className="h-full w-full flex flex-col">
            {sidebar}
          </div>
        </ResizablePanel>
        <ResizablePanel 
          defaultSize={80} 
          minSize={60}
          className="overflow-hidden"
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

