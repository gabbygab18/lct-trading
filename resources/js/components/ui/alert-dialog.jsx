'use client';

// scrollxui alert-dialog, ported to JSX and LCT colours. The shake on an
// outside click is theirs; the gradient/3D action button is swapped for the
// site's signal red.
import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

// Above the tray side-sheet (z-999), which is where most removals start.
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-[1000] bg-black/70 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className,
        )}
        {...props}
    />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef(({ className, children }, _ref) => {
    const contentRef = React.useRef(null);
    const [shakeKey, setShakeKey] = React.useState(0);

    // Clicking outside doesn't dismiss an alert; the card shakes instead.
    React.useEffect(() => {
        function handleOutsideClick(event) {
            const node = contentRef.current;
            if (node && event.target && !node.contains(event.target)) setShakeKey((k) => k + 1);
        }
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, []);

    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogPrimitive.Content asChild>
                <div className="fixed left-1/2 top-1/2 z-[1000] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        key={shakeKey}
                        ref={contentRef}
                        initial={shakeKey ? false : { opacity: 0, scale: 0.92 }}
                        animate={shakeKey ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { opacity: 1, scale: 1 }}
                        transition={shakeKey ? { duration: 0.5, ease: 'easeInOut' } : { type: 'spring', stiffness: 420, damping: 28 }}
                        className={cn('grid gap-5 rounded-[6px] border border-foam-500 bg-foam-800 p-6 text-steel-200 shadow-2xl', className)}
                    >
                        {children}
                    </motion.div>
                </div>
            </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
    );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...props }) => (
    <div className={cn('flex flex-col items-center gap-2 text-center', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...props }) => (
    <div className={cn('grid grid-cols-2 gap-2', className)} {...props} />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title ref={ref} className={cn('stamp text-lg text-steel-50', className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description ref={ref} className={cn('text-sm leading-relaxed text-steel-400', className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const buttonBase =
    'inline-flex h-11 items-center justify-center gap-2 rounded-[4px] px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal';

const AlertDialogAction = React.forwardRef(({ className, children, ...props }, ref) => (
    <AlertDialogPrimitive.Action asChild ref={ref} {...props}>
        <motion.button
            className={cn(buttonBase, 'bg-signal text-white hover:bg-signal-600', className)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
            {children}
        </motion.button>
    </AlertDialogPrimitive.Action>
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Cancel
        ref={ref}
        className={cn(buttonBase, 'border border-foam-500 text-steel-200 hover:bg-foam-600 hover:text-white', className)}
        {...props}
    />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
