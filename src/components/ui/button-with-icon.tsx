import Link from "next/link";
import { LucideIcon } from "lucide-react";

type BaseProps = {
    icon: LucideIcon;
    children: React.ReactNode;
    className?: string;
    iconSize?: number;
};

export function ButtonWithIcon({
    icon: Icon,
    children,
    className = "",
    iconSize = 18,
    ...props
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 ${className}`}
            {...props}
        >
            <Icon size={iconSize} className="flex-shrink-0" />
            {children}
        </button>
    );
}

export function LinkWithIcon({
    icon: Icon,
    children,
    href,
    className = "",
    iconSize = 18,
}: BaseProps & { href: string }) {
    return (
        <Link href={href} className={`inline-flex items-center justify-center gap-2 ${className}`}>
            <Icon size={iconSize} className="flex-shrink-0" />
            {children}
        </Link>
    );
}
