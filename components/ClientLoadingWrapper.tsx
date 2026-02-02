"use client";

import dynamic from "next/dynamic";
import { ComponentType, ReactNode } from "react";

interface ClientWrapperProps<T extends object> {
    component: ComponentType<T>;
    props?: T;
    fallback?: ReactNode;
}

function LoadingScreen() {
    return <div>Loading...</div>
}

export function ClientWrapper<T extends object>({component, props, fallback = <LoadingScreen />}: ClientWrapperProps<T>) {
    const DynamicComponent = dynamic(
        () => Promise.resolve(component),
        { ssr: false, loading: () => fallback }
    );

    return <DynamicComponent {...(props as T)} />;
}

