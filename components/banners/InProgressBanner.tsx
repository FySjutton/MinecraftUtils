'use client';

import { Banner, BannerIcon, BannerTitle } from '@/components/ui/banner';
import React from 'react';
import {IconFlag} from "@tabler/icons-react";

export default function InProgressBanner() {
    return (
        <Banner
            variant="secondary"
            inset
            className="bg-[#ff6b6b] text-white cursor-pointer"
        >
            <BannerIcon icon={IconFlag} className="bg-white/20 text-white" />
            <BannerTitle>This website is still under development! Report any bugs and feature requests on github!</BannerTitle>
        </Banner>
    );
}
