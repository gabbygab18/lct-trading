"use client";
import React, { createContext, useContext, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

// ScrollX UI — @scrollxui/animated-tabs (MIT), adapted for LCT:
//  • optional controlled use (value + onValueChange) so tabs can drive a
//    form field or a page visit, uncontrolled defaultValue still works
//  • className hooks on the list, the trigger, and the rising fill
//  • tab roles, aria-selected, roving tabindex and arrow-key movement
// The effect itself is the registry's: the active tab fills from the bottom.

const TabsContext = createContext(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within <Tabs>");
  }
  return context;
}

const Tabs = ({ defaultValue, value, onValueChange, className, children }) => {
  const [internal, setInternal] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internal;
  const setActiveTab = (next) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={twMerge("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className, ...props }) => {
  const ref = useRef(null);

  // Left/Right (and Home/End) move between tabs, like native tab strips.
  const onKeyDown = (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" };
    if (!(e.key in keys)) return;
    const tabs = [...ref.current.querySelectorAll('[role="tab"]:not([disabled])')];
    const i = tabs.indexOf(document.activeElement);
    const step = keys[e.key];
    const next = step === "first" ? tabs[0] : step === "last" ? tabs[tabs.length - 1] : tabs[(i + step + tabs.length) % tabs.length];
    if (next) {
      e.preventDefault();
      next.focus();
      next.click();
    }
  };

  return (
    <div
      ref={ref}
      role="tablist"
      onKeyDown={onKeyDown}
      className={twMerge("flex border-b border-gray-200 dark:border-gray-800", className)}
      {...props}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children, className, activeClassName, fillClassName, ...props }) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={twMerge(
        "relative px-4 py-2 text-sm font-medium rounded-t-md overflow-hidden transition-colors duration-500",
        className
      )}
      {...props}>
      <span
        className={twMerge(
          "relative z-10 inline-flex items-center gap-2 transition-colors duration-300",
          isActive
            ? twMerge("text-white dark:text-black", activeClassName)
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        )}>
        {children}
      </span>
      <span
        aria-hidden="true"
        className={twMerge(
          "absolute bottom-0 left-0 h-full w-full origin-bottom scale-y-0 transition-transform duration-500 ease-out z-0 rounded-t-md",
          isActive ? twMerge("scale-y-100 bg-black dark:bg-white", fillClassName) : "bg-transparent"
        )} />
    </button>
  );
};

const TabsContent = ({ value, children, className }) => {
  const { activeTab } = useTabsContext();
  return activeTab === value ? <div role="tabpanel" className={twMerge("p-4", className)}>{children}</div> : null;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
