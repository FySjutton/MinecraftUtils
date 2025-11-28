'use client';

import { Banner, BannerIcon, BannerTitle } from '@/components/ui/banner';
import {Flag} from 'lucide-react';
import React from 'react';

export default function InProgressBanner() {
    return (
        <Banner
            variant="secondary"
            inset
            className="bg-[#ff8787] text-white cursor-pointer"
        >
            <BannerIcon icon={Flag} className="bg-white/20 text-white" />
            <BannerTitle>This website is still under development! Report any bugs and feature requests on github!</BannerTitle>
        </Banner>
    );
}
