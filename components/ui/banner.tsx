'use client';

import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { type LucideIcon, XIcon } from 'lucide-react';
import {
    type ComponentProps,
    createContext,
    type HTMLAttributes,
    type MouseEventHandler,
    useContext,
} from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BannerContextProps = {
    show: boolean;
    setShow: (show: boolean) => void;
};

export const BannerContext = createContext<BannerContextProps>({
    show: true,
    setShow: () => {},
});

export type BannerProps = HTMLAttributes<HTMLDivElement> & {
    visible?: boolean;
    defaultVisible?: boolean;
    onClose?: () => void;
    inset?: boolean;
    variant?: 'default' | 'destructive' | 'secondary' | 'outline' | 'ghost' | 'link';
    className?: string;
};

export const Banner = ({
                           children,
                           visible,
                           defaultVisible = true,
                           onClose,
                           className,
                           inset = false,
                           variant = 'default', // default variant
                           ...props
                       }: BannerProps) => {
    const [show, setShow] = useControllableState({
        defaultProp: defaultVisible,
        prop: visible,
        onChange: onClose,
    });

    if (!show) return null;

    const bgClassMap: Record<string, string> = {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-white',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border bg-background text-foreground',
        ghost: 'bg-transparent text-foreground',
        link: 'bg-transparent text-primary underline',
    };

    return (
        <BannerContext.Provider value={{ show, setShow }}>
            <div
                className={cn(
                    'flex w-full items-center justify-between gap-2 px-4 py-2',
                    bgClassMap[variant],
                    inset && 'rounded-lg',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </BannerContext.Provider>
    );
};

export type BannerIconProps = HTMLAttributes<HTMLDivElement> & {
    icon: LucideIcon;
};

export const BannerIcon = ({ icon: Icon, className, ...props }: BannerIconProps) => (
    <div
        className={cn('rounded-full border border-background/20 bg-background/10 p-1 shadow-sm', className)}
        {...props}
    >
        <Icon size={16} />
    </div>
);

export type BannerTitleProps = HTMLAttributes<HTMLParagraphElement>;

export const BannerTitle = ({ className, ...props }: BannerTitleProps) => (
    <p className={cn('flex-1 text-sm font-medium', className)} {...props} />
);

export type BannerActionProps = ComponentProps<typeof Button>;

export const BannerAction = ({ size = 'sm', variant = 'default', className, ...props }: BannerActionProps) => (
    <Button size={size} variant={variant} className={cn('shrink-0', className)} {...props} />
);

export type BannerCloseProps = ComponentProps<typeof Button>;

export const BannerClose = ({ size = 'icon', variant = 'ghost', onClick, className, ...props }: BannerCloseProps) => {
    const { setShow } = useContext(BannerContext);

    const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
        setShow(false);
        onClick?.(e);
    };

    return (
        <Button
            onClick={handleClick}
            size={size}
            variant={variant}
            className={cn('shrink-0', className)}
            {...props}
        >
            <XIcon size={18} />
        </Button>
    );
};
