'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {FireworkColors, FireworkColorsReverse} from "@/lib/Colors";
import {FireworkExplosion, FireworkShape} from "@/app/generators/fireworks/algorithms";

interface FireworkControlsProps {
    explosion: FireworkExplosion;
    onExplosionChange: (explosion: FireworkExplosion) => void;
    onLaunch: () => void;
    particleCount: number;
    randomRotation: boolean;
    onRandomRotationChange: (enabled: boolean) => void;
}

export function FireworkControls({
                                     explosion,
                                     onExplosionChange,
                                     onLaunch,
                                     particleCount,
                                     randomRotation,
                                     onRandomRotationChange,
                                 }: FireworkControlsProps) {

    const shapes: FireworkShape[] = ['SMALL_BALL', 'LARGE_BALL', 'STAR', 'CREEPER', 'BURST'];

    const updateExplosion = (updates: Partial<FireworkExplosion>) => {
        onExplosionChange({ ...explosion, ...updates });
    };

    const toggleColor = (color: number, isFade: boolean = false) => {
        const colorArray = isFade ? explosion.fadeColors : explosion.colors;

        const newColors = colorArray.includes(color)
            ? colorArray.filter((c) => c !== color)
            : [...colorArray, color];

        updateExplosion(
            isFade ? { fadeColors: newColors } : { colors: newColors }
        );
    };

    const colorEntries = Object.entries(FireworkColors);

    return (
        <div className="space-y-4">
            {/* Launch Button */}
            <Card>
                <CardContent className="pt-6">
                    <Button onClick={onLaunch} size="lg" className="w-full">
                        Launch Firework
                    </Button>
                    <div className="mt-3 text-sm text-muted-foreground text-center">
                        Active particles: {particleCount}
                    </div>
                </CardContent>
            </Card>

            {/* Shape */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Shape</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                        {shapes.map((shape) => (
                            <Button
                                key={shape}
                                onClick={() => updateExplosion({ shape })}
                                variant={explosion.shape === shape ? 'default' : 'outline'}
                                size="sm"
                            >
                                {shape.replace('_', ' ')}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Colors */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Colors</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="primary">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="primary">
                                Primary
                                {explosion.colors.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {explosion.colors.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="fade">
                                Fade
                                {explosion.fadeColors.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {explosion.fadeColors.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="primary" className="mt-4">
                            <div className="grid grid-cols-4 gap-2">
                                {colorEntries.map(([name, color]) => (
                                    <button
                                        key={name}
                                        onClick={() => toggleColor(color, false)}
                                        className={`
                      aspect-square rounded border-2 transition-all
                      ${
                                            explosion.colors.includes(color)
                                                ? 'border-primary scale-110 ring-2 ring-primary'
                                                : 'border-border hover:border-primary/50'
                                        }
                    `}
                                        style={{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }}
                                        title={FireworkColorsReverse[color]}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="fade" className="mt-4">
                            <div className="grid grid-cols-4 gap-2">
                                {colorEntries.map(([name, color]) => (
                                    <button
                                        key={name}
                                        onClick={() => toggleColor(color, true)}
                                        className={`
                      aspect-square rounded border-2 transition-all
                      ${
                                            explosion.fadeColors.includes(color)
                                                ? 'border-primary scale-110 ring-2 ring-primary'
                                                : 'border-border hover:border-primary/50'
                                        }
                    `}
                                        style={{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }}
                                        title={FireworkColorsReverse[color]}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Effects */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="trail">Trail</Label>
                        <Switch
                            id="trail"
                            checked={explosion.hasTrail}
                            onCheckedChange={(checked) => updateExplosion({ hasTrail: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="twinkle">Twinkle</Label>
                        <Switch
                            id="twinkle"
                            checked={explosion.hasTwinkle}
                            onCheckedChange={(checked) => updateExplosion({ hasTwinkle: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="rotation">Random Rotation</Label>
                        <Switch
                            id="rotation"
                            checked={randomRotation}
                            onCheckedChange={onRandomRotationChange}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}