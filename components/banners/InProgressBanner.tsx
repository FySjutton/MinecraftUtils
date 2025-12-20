import {Banner, BannerIcon, BannerTitle} from "@/components/ui/banner";
import React from "react";
import {IconAlertOctagon} from "@tabler/icons-react";

export default function InProgressBanner() {
    return <Banner
        variant="secondary"
        inset
        className="cursor-pointer"
        style={{ backgroundColor: "#ba2727", color: "#FFFFFF" }}
    >
        <BannerIcon icon={IconAlertOctagon} className={"bg-white/20 text-white"} />
        <BannerTitle>{"WARNING! | This utility is still in progress, and is not yet finished! Avoid using it, it is only here in order for developers to test it!"}</BannerTitle>
    </Banner>
}