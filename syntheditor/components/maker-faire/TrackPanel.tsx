'use client'

import React, { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrackGrid } from './TrackGrid'
import { MixerFaders } from './MixerFaders'
import { TrackEditor } from './TrackEditor'

export function TrackPanel() {
    return (
        <Tabs defaultValue="live" className="w-full h-full flex flex-col">
            <TabsList className="self-center">
                <TabsTrigger value="live">LIVE</TabsTrigger>
                <TabsTrigger value="mix">MIX</TabsTrigger>
                <TabsTrigger value="edit">EDIT</TabsTrigger>
            </TabsList>
            <div className="flex-1 min-h-0">
                <TabsContent value="live" className="h-full m-0">
                    <TrackGrid />
                </TabsContent>
                <TabsContent value="mix" className="h-full m-0">
                    <MixerFaders />
                </TabsContent>
                <TabsContent value="edit" className="h-full m-0">
                    <TrackEditor />
                </TabsContent>
            </div>
        </Tabs>
    )
}


