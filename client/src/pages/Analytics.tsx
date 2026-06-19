import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, Users, DollarSign, Clock, Download,
  ArrowUpRight, ArrowDownRight, BarChart3, Activity, 
  Globe, Smartphone, Monitor, Tablet,
  TrendingUp, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dropdown } from '@/components/ui/dropdown'
import { Tabs } from '@/components/ui/Tabs'

// Time range options
const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
]

// Analytics sub-tabs - focused on insights, projections, and ROI
const analyticsTabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'projections', label: 'Projections', icon: TrendingUp },
  { id: 'roi', label: 'ROI Analysis', icon: Target },
  { id: 'audience', label: 'Audience', icon: Globe },
]

// Mock Data
const overviewStats = [
  { label: 'Total Views', value: '2.4M', change: '+18.5%', positive: true, icon: Eye },
  { label: 'Watch Time', value: '482K hrs', change: '+12.3%', positive: true, icon: Clock },
  { label: 'Subscribers', value: '156K', change: '+8.2%', positive: true, icon: Users },
  { label: 'Revenue', value: '$12.4K', change: '+23.1%', positive: true, icon: DollarSign },
]

const channelData = [
  { name: 'Tech Daily', subscribers: '245K', views: '1.2M', watchTime: '180K hrs', engagement: '4.2%', status: 'active' },
  { name: 'Gaming Hub', subscribers: '1.2M', views: '4.8M', watchTime: '850K hrs', engagement: '5.8%', status: 'active' },
  { name: 'Fitness Pro', subscribers: '567K', views: '2.1M', watchTime: '420K hrs', engagement: '3.9%', status: 'active' },
  { name: 'Cooking Daily', subscribers: '189K', views: '680K', watchTime: '95K hrs', engagement: '6.1%', status: 'growing' },
]

const audienceData = {
  demographics: [
    { group: '18-24', percentage: 28 },
    { group: '25-34', percentage: 42 },
    { group: '35-44', percentage: 18 },
    { group: '45-54', percentage: 8 },
    { group: '55+', percentage: 4 },
  ],
  devices: [
    { device: 'Mobile', percentage: 58, icon: Smartphone },
    { device: 'Desktop', percentage: 32, icon: Monitor },
    { device: 'Tablet', percentage: 10, icon: Tablet },
  ],
  topCountries: [
    { country: 'United States', viewers: '485K', percentage: 35 },
    { country: 'United Kingdom', viewers: '156K', percentage: 12 },
    { country: 'Canada', viewers: '98K', percentage: 8 },
    { country: 'Germany', viewers: '76K', percentage: 6 },
    { country: 'Australia', viewers: '54K', percentage: 4 },
  ],
}

// Sub-components
function StatCard({ stat, index }: { stat: typeof overviewStats[0]; index: number }) {
  const Icon = stat.icon
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="h-full">
      <Card hover={false} className="h-full">
        <CardContent className="p-5 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <Icon className="w-5 h-5 text-[#10b981]" />
            <div className={`flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {stat.change}
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-xs text-[#909090] mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">{stat.value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function DemographicsBar({ data }: { data: { group: string; percentage: number }[] }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.group} className="flex items-center gap-3">
          <span className="text-xs text-[#909090] w-12">{item.group}</span>
          <div className="flex-1 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full"
            />
          </div>
          <span className="text-xs font-medium text-[#E8E8E8] w-10 text-right">{item.percentage}%</span>
        </div>
      ))}
    </div>
  )
}

// Tab Content Components
function OverviewTab({ timeRange }: { timeRange: string }) {
  const timeRangeLabel = timeRanges.find(r => r.value === timeRange)?.label || 'Last 30 days'
  
  // Chart data based on time range
  const chartData: Record<string, { points: { x: number; y: number; value: string; label: string }[]; line: string; xLabels: string[] }> = {
    '7d': {
      points: [
        { x: 0, y: 180, value: '8K', label: 'Day 1' },
        { x: 200, y: 150, value: '35K', label: 'Day 2' },
        { x: 400, y: 100, value: '62K', label: 'Day 4' },
        { x: 700, y: 50, value: '95K', label: 'Day 6' },
        { x: 1000, y: 20, value: '128K', label: 'Day 7' },
      ],
      line: 'M0,180 L200,150 L400,100 L700,50 L1000,20',
      xLabels: ['Day 1', 'Day 4', 'Day 7'],
    },
    '30d': {
      points: [
        { x: 0, y: 180, value: '12K', label: 'Jun 6' },
        { x: 250, y: 140, value: '45K', label: 'Jun 13' },
        { x: 500, y: 70, value: '98K', label: 'Jun 20' },
        { x: 750, y: 30, value: '132K', label: 'Jun 27' },
        { x: 1000, y: 10, value: '148K', label: 'Jul 6' },
      ],
      line: 'M0,180 L250,140 L500,70 L750,30 L1000,10',
      xLabels: ['Jun 6', 'Jun 15', 'Jun 24', 'Jul 3', 'Jul 6'],
    },
    '90d': {
      points: [
        { x: 0, y: 200, value: '5K', label: 'Apr 1' },
        { x: 200, y: 180, value: '22K', label: 'May 1' },
        { x: 500, y: 120, value: '58K', label: 'Jun 1' },
        { x: 800, y: 60, value: '112K', label: 'Jul 1' },
        { x: 1000, y: 20, value: '148K', label: 'Jul 6' },
      ],
      line: 'M0,200 L200,180 L500,120 L800,60 L1000,20',
      xLabels: ['Apr', 'May', 'Jun', 'Jul'],
    },
    '1y': {
      points: [
        { x: 0, y: 190, value: '2K', label: 'Aug 2024' },
        { x: 250, y: 175, value: '18K', label: 'Oct 2024' },
        { x: 500, y: 135, value: '55K', label: 'Dec 2024' },
        { x: 750, y: 75, value: '102K', label: 'Feb 2025' },
        { x: 1000, y: 20, value: '148K', label: 'Jul 2025' },
      ],
      line: 'M0,190 L250,175 L500,135 L750,75 L1000,20',
      xLabels: ['Aug', 'Oct', 'Dec', 'Feb', 'Jul'],
    },
  }
  const currentData = chartData[timeRange] || chartData['30d']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
        {overviewStats.map((stat, index) => <StatCard key={stat.label} stat={stat} index={index} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-stretch">
        <Card hover={false} className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Views Trend</CardTitle>
            <CardDescription>Daily view count over {timeRangeLabel.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <div className="h-full flex gap-3">
              {/* Y-Axis */}
              <div className="w-10 flex flex-col justify-between text-[10px] text-[#505050] text-right">
                <span>150K</span>
                <span>100K</span>
                <span>50K</span>
                <span>0</span>
              </div>
              
              {/* Chart Area */}
              <div className="flex-1 relative border-l border-b border-[#252525]">
                {/* Grid Lines */}
                <div className="absolute inset-0">
                  {[0, 33, 66, 100].map((y) => (
                    <div key={y} className="absolute w-full border-t border-dashed border-[#1A1A1A]" style={{ bottom: `${y}%` }} />
                  ))}
                </div>
                
                {/* Line Chart - No fill, just crisp line */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  {/* Line Only - Straight lines between points */}
                  <motion.path
                    d={currentData.line}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  
                  {/* Data Points - Aligned to curve */}
                  {currentData.points.map((point: { x: number; y: number }, i: number) => (
                    <motion.circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#10b981"
                      stroke="#0a0a0a"
                      strokeWidth="2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    />
                  ))}
                </svg>
                
                {/* Hover Points with Tooltips - HTML overlay */}
                {currentData.points.map((point: { x: number; y: number; value: string; label: string }, i: number) => (
                  <div
                    key={i}
                    className="absolute group cursor-pointer"
                    style={{ left: `${point.x / 10}%`, top: `${point.y / 2}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#0a0a0a] group-hover:scale-125 transition-transform" />
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-[#1A1A1A] border border-[#252525] rounded px-2 py-1 text-center whitespace-nowrap">
                        <p className="text-[10px] text-[#909090]">{point.label}</p>
                        <p className="text-xs font-bold text-[#E8E8E8]">{point.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* X-Axis Labels */}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-[#505050]">
                  {currentData.xLabels.map((label: string, i: number) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover={false} className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Top Channels</CardTitle>
            <CardDescription>Performance by connected channel</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3">
              {channelData.slice(0, 4).map((channel, i) => (
                <div key={channel.name} className="flex items-center gap-3">
                  <span className="text-xs text-[#505050] w-4">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-xs font-medium text-[#909090]">
                    {channel.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E8E8E8] truncate">{channel.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#E8E8E8]">{channel.views}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PerformanceTab() {
  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Avg View Duration', value: '4:32', change: '+12%', positive: true },
          { label: 'Click-Through Rate', value: '8.5%', change: '+2.1%', positive: true },
          { label: 'Engagement Rate', value: '5.8%', change: '-0.3%', positive: false },
          { label: 'Subscriber Conversion', value: '2.4%', change: '+0.8%', positive: true },
        ].map((metric, index) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card hover={false}>
              <CardContent className="p-5">
                <p className="text-xs text-[#909090] mb-1">{metric.label}</p>
                <p className="text-xl font-bold text-[#E8E8E8]">{metric.value}</p>
                <p className={`text-xs mt-1 ${metric.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metric.positive ? '+' : ''}{metric.change} vs last period
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Multi-Channel Performance Chart */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Channel Performance Comparison</CardTitle>
          <CardDescription>Views trend across all connected channels</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex flex-col">
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Y-Axis */}
            <div className="w-12 flex flex-col justify-between text-[10px] text-[#505050] text-right">
              <span>500K</span>
              <span>375K</span>
              <span>250K</span>
              <span>125K</span>
              <span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="flex-1 relative border-l border-b border-[#252525]">
              {/* Grid */}
              <div className="absolute inset-0">
                {[0, 25, 50, 75, 100].map((y) => (
                  <div key={y} className="absolute w-full border-t border-dashed border-[#1A1A1A]" style={{ bottom: `${y}%` }} />
                ))}
              </div>
              
              {/* Multi-Line Chart */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {/* Gaming Hub - Purple */}
                <motion.path
                  d="M0,180 C50,170 100,140 150,130 C200,110 250,90 300,70 C350,60 400,50 450,40 L500,35"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                
                {/* Tech Daily - Emerald */}
                <motion.path
                  d="M0,160 C50,150 100,120 150,100 C200,80 250,70 300,55 C350,45 400,35 450,30 L500,25"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.2, ease: "easeInOut" }}
                />
                
                {/* Fitness Pro - Blue */}
                <motion.path
                  d="M0,200 C50,190 100,180 150,170 C200,160 250,150 300,140 C350,135 400,130 450,125 L500,120"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}
                />
                
                {/* Cooking Daily - Amber */}
                <motion.path
                  d="M0,220 C50,210 100,200 150,195 C200,190 250,185 300,180 C350,178 400,175 450,172 L500,170"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
                />
              </svg>
              
              {/* X-Axis Labels */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-[#505050] px-2">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </div>
            </div>
          </div>
          
          {/* Legend - Extra padding to prevent overlap */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-shrink-0">
            {[
              { name: 'Gaming Hub', color: '#a855f7', value: '485K' },
              { name: 'Tech Daily', color: '#10b981', value: '520K' },
              { name: 'Fitness Pro', color: '#3b82f6', value: '380K' },
              { name: 'Cooking Daily', color: '#f59e0b', value: '310K' },
            ].map((channel) => (
              <div key={channel.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: channel.color }} />
                <span className="text-xs text-[#909090]">{channel.name}</span>
                <span className="text-xs font-semibold text-[#E8E8E8]">{channel.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Engagement by Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Tutorials', engagement: '8.5%', views: '45%', color: 'bg-emerald-500' },
                { type: 'Vlogs', engagement: '6.2%', views: '28%', color: 'bg-blue-500' },
                { type: 'Reviews', engagement: '9.1%', views: '15%', color: 'bg-purple-500' },
                { type: 'Live Streams', engagement: '12.3%', views: '12%', color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.type} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#E8E8E8]">{item.type}</span>
                      <span className="text-sm text-[#909090]">{item.engagement}</span>
                    </div>
                    <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: item.views }}
                        transition={{ duration: 0.8 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle>Upload Frequency Impact</CardTitle>
            <CardDescription>Engagement rate vs uploads per day</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col">
            <div className="flex-1 flex gap-3 min-h-0">
              {/* Y-Axis */}
              <div className="w-8 flex flex-col justify-between text-[10px] text-[#505050] text-right flex-shrink-0">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              
              {/* Chart */}
              <div className="flex-1 relative border-l border-b border-[#252525] min-h-0">
                {/* Grid */}
                <div className="absolute inset-0">
                  {[0, 25, 50, 75, 100].map((y) => (
                    <div key={y} className="absolute w-full border-t border-dashed border-[#1A1A1A]" style={{ bottom: `${y}%` }} />
                  ))}
                </div>
                
                {/* Dual Bar Chart - Using percentage-based heights */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-around px-2 pb-4 gap-2">
                  {[
                    { day: 'Mon', uploads: 2, engagement: 85 },
                    { day: 'Tue', uploads: 3, engagement: 92 },
                    { day: 'Wed', uploads: 1, engagement: 78 },
                    { day: 'Thu', uploads: 4, engagement: 88 },
                    { day: 'Fri', uploads: 2, engagement: 95 },
                    { day: 'Sat', uploads: 5, engagement: 72 },
                    { day: 'Sun', uploads: 3, engagement: 90 },
                  ].map((day, i) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      {/* Engagement Bar - Height matches percentage */}
                      <div className="w-full flex justify-center gap-1 items-end" style={{ height: '100%' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${day.engagement}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className="w-1/2 bg-[#10b981] rounded-t"
                          title={`Engagement: ${day.engagement}%`}
                        />
                        {/* Upload Count Bar - Scaled to fit (max 5 uploads = 100%) */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(day.uploads / 5) * 100}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                          className="w-1/2 bg-[#3b82f6]/60 rounded-t"
                          title={`Uploads: ${day.uploads}`}
                        />
                      </div>
                      <span className="text-[10px] text-[#909090] flex-shrink-0">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#10b981] rounded" />
                <span className="text-xs text-[#909090]">Engagement %</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#3b82f6]/60 rounded" />
                <span className="text-xs text-[#909090]">Uploads</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProjectionsTab() {
  return (
    <div className="space-y-6">
      {/* AI Prediction Cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card hover={false}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <Badge className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5">AI Predicted</Badge>
            </div>
            <p className="text-xs text-[#909090] mb-1">Projected Views (Next 30 Days)</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">3.2M</p>
            <p className="text-xs text-emerald-400 mt-1">+33% based on current trajectory</p>
            <div className="mt-3 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 1 }}
                className="h-full bg-purple-500 rounded-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <Badge className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5">AI Predicted</Badge>
            </div>
            <p className="text-xs text-[#909090] mb-1">Projected Subscribers (Next 90 Days)</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">185K</p>
            <p className="text-xs text-emerald-400 mt-1">+18.6% growth forecast</p>
            <div className="mt-3 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '62%' }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5">AI Predicted</Badge>
            </div>
            <p className="text-xs text-[#909090] mb-1">Projected Revenue (Next Quarter)</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">$42.8K</p>
            <p className="text-xs text-emerald-400 mt-1">+45% quarter-over-quarter</p>
            <div className="mt-3 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '88%' }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Trajectory Chart */}
      <Card hover={false}>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div>
              <CardTitle className="flex items-center gap-3">
                <span>3.2M</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px]">+33.4%</Badge>
                <span className="text-xs text-[#505050] font-normal">Projected Views</span>
              </CardTitle>
              <CardDescription>AI-powered growth forecast</CardDescription>
            </div>
            <Badge className="bg-[#10b981]/10 text-[#10b981] text-[10px] px-2 py-0.5">98% Confidence</Badge>
          </div>
          
          {/* Time Range Controls */}
          <div className="flex gap-1 mt-3">
            {['1D', '1W', '1M', '3M', '6M', '1Y', 'All'].map((range) => (
              <button
                key={range}
                className={`px-2 py-1 text-xs rounded ${
                  range === '6M' 
                    ? 'bg-[#1A1A1A] text-[#E8E8E8]' 
                    : 'text-[#505050] hover:text-[#909090]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0 h-96">
          <div className="h-full flex gap-3">
              {/* Y-Axis */}
              <div className="w-10 flex flex-col justify-between text-[10px] text-[#505050] text-right py-1">
                <span>500K</span>
                <span>450K</span>
                <span>400K</span>
                <span>350K</span>
                <span>300K</span>
                <span>250K</span>
                <span>200K</span>
                <span>150K</span>
                <span>100K</span>
                <span>50K</span>
                <span>0</span>
              </div>
              
              {/* Main Chart */}
              <div className="flex-1 relative border-l border-b border-[#252525]">
                {/* Fine Grid */}
                <div className="absolute inset-0">
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((y) => (
                    <div key={y} className="absolute w-full border-t border-[#1A1A1A]" style={{ top: `${y}%` }} />
                  ))}
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((x) => (
                    <div key={x} className="absolute h-full border-l border-[#1A1A1A]" style={{ left: `${x}%` }} />
                  ))}
                </div>
                
                {/* Historical / Projected Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-[#505050] z-20">
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-[#909090] bg-[#0a0a0a] px-1 whitespace-nowrap">Forecast Start</span>
                </div>
                
                {/* Candlestick Data */}
                <div className="absolute inset-0 flex items-end justify-around px-3 pb-7 gap-[3px]">
                  {[
                    // Historical data with realistic up/down movements
                    { o: 125, h: 132, l: 118, c: 128, type: 'hist' }, // up
                    { o: 128, h: 135, l: 122, c: 130, type: 'hist' }, // up
                    { o: 130, h: 134, l: 115, c: 118, type: 'hist' }, // down - dip
                    { o: 118, h: 128, l: 112, c: 125, type: 'hist' }, // recovery
                    { o: 125, h: 145, l: 120, c: 142, type: 'hist' }, // big up
                    { o: 142, h: 150, l: 135, c: 138, type: 'hist' }, // small down
                    { o: 138, h: 162, l: 134, c: 158, type: 'hist' }, // up
                    { o: 158, h: 175, l: 152, c: 172, type: 'hist' }, // up
                    { o: 172, h: 180, l: 158, c: 162, type: 'hist' }, // down
                    { o: 162, h: 190, l: 158, c: 185, type: 'hist' }, // strong up
                    { o: 185, h: 210, l: 180, c: 208, type: 'hist' }, // up
                    { o: 208, h: 235, l: 198, c: 232, type: 'hist' }, // up
                    { o: 232, h: 255, l: 220, c: 240, type: 'hist' }, // down
                    { o: 240, h: 275, l: 235, c: 270, type: 'hist' }, // up
                    { o: 270, h: 295, l: 260, c: 285, type: 'hist' }, // up
                    { o: 285, h: 310, l: 275, c: 290, type: 'hist' }, // small down
                    { o: 290, h: 340, l: 282, c: 335, type: 'hist' }, // breakout
                    { o: 335, h: 365, l: 320, c: 355, type: 'hist' }, // up
                    // Projected with confidence
                    { o: 355, h: 385, l: 340, c: 375, type: 'proj' },
                    { o: 375, h: 410, l: 360, c: 395, type: 'proj' },
                    { o: 395, h: 430, l: 380, c: 405, type: 'proj' },
                    { o: 405, h: 445, l: 390, c: 420, type: 'proj' },
                    { o: 420, h: 465, l: 408, c: 440, type: 'proj' },
                    { o: 440, h: 490, l: 425, c: 465, type: 'proj' },
                    { o: 465, h: 515, l: 450, c: 495, type: 'proj' },
                    { o: 495, h: 550, l: 480, c: 525, type: 'proj' },
                  ].map((candle, i) => {
                    const isProjected = candle.type === 'proj'
                    const isGreen = candle.c >= candle.o
                    const maxVal = 550
                    const pct = (val: number) => (val / maxVal) * 100
                    
                    const bodyTop = pct(Math.max(candle.o, candle.c))
                    const bodyBottom = pct(Math.min(candle.o, candle.c))
                    const wickTop = pct(candle.h)
                    const wickBottom = pct(candle.l)
                    
                    return (
                      <div key={i} className="flex-1 h-full relative flex justify-center" style={{ maxWidth: '24px' }}>
                        {/* Confidence band for projected candles */}
                        {isProjected && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.015 }}
                            className="absolute w-[120%] bg-emerald-500/10 rounded-sm -left-[10%]"
                            style={{
                              bottom: `${wickBottom}%`,
                              height: `${wickTop - wickBottom + 5}%`,
                            }}
                          />
                        )}
                        
                        {/* Full height wick line */}
                        <div
                          className="absolute w-[2px] rounded-full"
                          style={{
                            backgroundColor: isProjected 
                              ? (isGreen ? 'rgba(52, 211, 153, 0.7)' : 'rgba(248, 113, 113, 0.7)')
                              : (isGreen ? '#10b981' : '#ef4444'),
                            bottom: `${wickBottom}%`,
                            height: `${wickTop - wickBottom}%`,
                          }}
                        />
                        
                        {/* Candle body */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(bodyTop - bodyBottom, 1)}%` }}
                          transition={{ duration: 0.4, delay: i * 0.015 }}
                          className="absolute w-full rounded-[2px] z-10 border"
                          style={{
                            bottom: `${bodyBottom}%`,
                            backgroundColor: isProjected
                              ? (isGreen ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)')
                              : (isGreen ? '#10b981' : '#ef4444'),
                            borderColor: isProjected
                              ? (isGreen ? 'rgba(52, 211, 153, 0.8)' : 'rgba(248, 113, 113, 0.8)')
                              : (isGreen ? '#059669' : '#dc2626'),
                            borderWidth: '1px',
                            minHeight: '2px',
                          }}
                        />
                      </div>
                    )
                  })}</div>
                  
                {/* Current Price Indicator */}
                <div 
                  className="absolute left-0 right-0 border-t-2 border-dashed border-[#E8E8E8] z-20 flex items-center pointer-events-none"
                  style={{ bottom: '63%' }}
                >
                  <span className="absolute right-0 -translate-y-1/2 text-[11px] font-medium text-[#E8E8E8] bg-[#0a0a0a] border border-[#505050] px-2 py-1 rounded">
                    347.5K Current
                  </span>
                </div>
                
                {/* AI Confidence Scenarios - Only in Projected Area */}
                <div className="absolute left-1/2 right-0 top-0 bottom-0">
                  {/* Best Case (Top 10%) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute left-0 right-0 top-[5%] h-[15%] bg-emerald-500/5 border-t border-dashed border-emerald-500/30"
                  >
                    <span className="absolute right-2 top-0 text-[9px] text-emerald-400/70">Best Case: 650K</span>
                  </motion.div>
                  
                  {/* Expected Range */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute left-0 right-0 top-[25%] h-[25%] bg-emerald-500/10 border-y border-dashed border-emerald-500/40 flex items-center justify-center"
                  >
                    <span className="text-[10px] text-emerald-400/80 font-medium">Expected Range: 420K - 525K</span>
                  </motion.div>
                  
                  {/* Worst Case (Bottom 10%) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute left-0 right-0 top-[80%] h-[15%] bg-red-500/5 border-b border-dashed border-red-500/30"
                  >
                    <span className="absolute right-2 bottom-0 text-[9px] text-red-400/70">Worst Case: 380K</span>
                  </motion.div>
                </div>
                
                {/* X-Axis Labels */}
                <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between items-center text-[10px] text-[#505050] px-4">
                  <span>Apr</span>
                  <span>May</span>
                  <span className="text-emerald-400">Jun</span>
                  <span className="text-[#909090]">Jul</span>
                  <span className="text-[#909090]">Aug</span>
                  <span className="text-[#909090]">Sep</span>
                </div>
              </div>
            </div>
          </CardContent>
          
          {/* Legend */}
          <CardContent className="pt-0">
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-4 bg-emerald-500 rounded-sm" />
                <span className="text-xs text-[#909090]">Historical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-4 bg-emerald-400/70 border border-emerald-400 rounded-sm" />
                <span className="text-xs text-[#909090]">AI Projected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-4 bg-emerald-500/20 rounded-sm" />
                <span className="text-xs text-[#909090]">Confidence</span>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Algorithm Insights */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Content Performance Prediction</CardTitle>
            <CardDescription>AI analysis of upcoming content potential</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: 'Summer Tech Reviews', score: 92, potential: 'High Viral', color: 'emerald' },
                { title: 'Gaming Setup Tour', score: 78, potential: 'Steady Growth', color: 'blue' },
                { title: 'Fitness Challenge', score: 65, potential: 'Moderate', color: 'amber' },
              ].map((content, i) => (
                <div key={content.title} className="flex items-center gap-4 p-3 bg-[#1A1A1A] rounded-lg">
                  <div className={`w-12 h-12 rounded-lg bg-${content.color}-500/10 flex items-center justify-center`}>
                    <span className={`text-lg font-semibold text-${content.color}-400`}>{content.score}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#E8E8E8]">{content.title}</p>
                    <p className={`text-xs text-${content.color}-400`}>{content.potential}</p>
                  </div>
                  <div className="w-24 h-2 bg-[#262626] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${content.score}%` }}
                      transition={{ duration: 0.8, delay: i * 0.2 }}
                      className={`h-full bg-${content.color}-500 rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle>Optimal Upload Schedule</CardTitle>
            <CardDescription>AI-recommended posting times for maximum reach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {[
                { day: 'Mon', time: '3:00 PM', score: 85 },
                { day: 'Tue', time: '5:00 PM', score: 92 },
                { day: 'Wed', time: '2:00 PM', score: 78 },
                { day: 'Thu', time: '6:00 PM', score: 88 },
                { day: 'Fri', time: '4:00 PM', score: 95 },
                { day: 'Sat', time: '11:00 AM', score: 72 },
                { day: 'Sun', time: '1:00 PM', score: 90 },
              ].map((slot) => (
                <div key={slot.day} className="text-center">
                  <div 
                    className="p-3 rounded-lg mb-2 transition-colors"
                    style={{ 
                      backgroundColor: slot.score >= 90 ? 'rgba(16, 185, 129, 0.2)' : 
                                       slot.score >= 80 ? 'rgba(59, 130, 246, 0.2)' : 
                                       'rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    <span className="text-lg font-semibold" style={{ 
                      color: slot.score >= 90 ? '#10b981' : 
                             slot.score >= 80 ? '#3b82f6' : 
                             '#f59e0b'
                    }}>{slot.score}</span>
                  </div>
                  <p className="text-xs text-[#909090]">{slot.day}</p>
                  <p className="text-[10px] text-[#505050]">{slot.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AudienceTab() {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Age Demographics</CardTitle>
          <CardDescription>Viewer age distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <DemographicsBar data={audienceData.demographics} />
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>Where viewers watch your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {audienceData.devices.map((device) => {
              const Icon = device.icon
              return (
                <div key={device.device} className="p-4 bg-[#1A1A1A] rounded-xl text-center">
                  <Icon className="w-5 h-5 text-[#10b981] mx-auto mb-2" />
                  <p className="text-xs text-[#909090] mb-0.5">{device.device}</p>
                  <p className="text-lg font-bold text-[#E8E8E8]">{device.percentage}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card hover={false} className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
          <CardDescription>Geographic distribution of viewers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {audienceData.topCountries.map((country) => (
              <div key={country.country} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#505050]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#E8E8E8]">{country.country}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[#909090]">{country.viewers}</span>
                  <div className="w-24 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${country.percentage}%` }} />
                  </div>
                  <span className="text-xs text-[#909090] w-8">{country.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ROITab() {
  return (
    <div className="space-y-6">
      {/* ROI Overview Cards */}
      <div className="grid lg:grid-cols-4 gap-4">
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-[#909090] mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">$4,200</p>
            <p className="text-xs text-[#505050] mt-1">Content production costs</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-[#909090] mb-1">Total Returns</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">$12,400</p>
            <p className="text-xs text-emerald-400 mt-1">+195% ROI</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-[#909090] mb-1">Cost Per View</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">$0.0018</p>
            <p className="text-xs text-emerald-400 mt-1">-12% from last month</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-[#909090] mb-1">Revenue Per Mille (RPM)</p>
            <p className="text-2xl font-bold text-[#E8E8E8]">$5.17</p>
            <p className="text-xs text-emerald-400 mt-1">+8.5% industry avg</p>
          </CardContent>
        </Card>
      </div>

      {/* ROI by Channel */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>ROI by Channel</CardTitle>
          <CardDescription>Return on investment comparison across channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Gaming Hub', investment: '$1,800', revenue: '$6,400', roi: 256, efficiency: 'Excellent' },
              { name: 'Tech Daily', investment: '$1,200', revenue: '$3,200', roi: 167, efficiency: 'Good' },
              { name: 'Fitness Pro', investment: '$800', revenue: '$1,800', roi: 125, efficiency: 'Good' },
              { name: 'Cooking Daily', investment: '$400', revenue: '$1,000', roi: 150, efficiency: 'Good' },
            ].map((channel) => (
              <div key={channel.name} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#909090]">{channel.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E8E8E8]">{channel.name}</p>
                </div>
                <div className="hidden md:grid grid-cols-4 gap-6 text-xs text-right">
                  <div><p className="text-[#505050] mb-0.5">Investment</p><p className="text-[#E8E8E8] font-semibold">{channel.investment}</p></div>
                  <div><p className="text-[#505050] mb-0.5">Revenue</p><p className="text-[#E8E8E8] font-semibold">{channel.revenue}</p></div>
                  <div><p className="text-[#505050] mb-0.5">ROI</p><p className="text-emerald-400 font-semibold">+{channel.roi}%</p></div>
                  <div><p className="text-[#505050] mb-0.5">Efficiency</p><Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400">{channel.efficiency}</Badge></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown & Efficiency */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Where your investment goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Content Production', amount: '$2,400', percentage: 57, color: 'bg-blue-500' },
                { category: 'Promotion & Ads', amount: '$1,000', percentage: 24, color: 'bg-purple-500' },
                { category: 'Tools & Software', amount: '$500', percentage: 12, color: 'bg-amber-500' },
                { category: 'Equipment', amount: '$300', percentage: 7, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.category} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#E8E8E8]">{item.category}</span>
                      <span className="text-sm text-[#909090]">{item.amount}</span>
                    </div>
                    <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[#505050] w-8 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle>Efficiency Metrics</CardTitle>
            <CardDescription>Content value optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { metric: 'Revenue per Hour', value: '$125', benchmark: '$85', status: 'above' },
                { metric: 'Cost per Subscriber', value: '$0.27', benchmark: '$0.45', status: 'below' },
                { metric: 'Views per Dollar', value: '571', benchmark: '420', status: 'above' },
                { metric: 'Engagement Value', value: '$2.14', benchmark: '$1.80', status: 'above' },
              ].map((item) => (
                <div key={item.metric} className="p-3 bg-[#1A1A1A] rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#E8E8E8]">{item.metric}</span>
                    <Badge className={`text-[10px] px-2 py-0.5 ${
                      item.status === 'above' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status === 'above' ? 'Above' : 'Below'} Benchmark
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-[#E8E8E8]">{item.value}</span>
                    <span className="text-xs text-[#505050]">vs {item.benchmark} industry avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Trend */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>ROI Trend Analysis</CardTitle>
          <CardDescription>Return on investment over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56 flex items-end gap-2">
            {[
              { month: 'Jan', roi: 85, revenue: 3200 },
              { month: 'Feb', roi: 92, revenue: 3800 },
              { month: 'Mar', roi: 110, revenue: 4500 },
              { month: 'Apr', roi: 135, revenue: 5800 },
              { month: 'May', roi: 156, revenue: 7200 },
              { month: 'Jun', roi: 195, revenue: 12400 },
            ].map((data, i) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1 h-40">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.roi / 200) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex-1 bg-[#10b981] rounded-t opacity-60"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.revenue / 12400) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                    className="flex-1 bg-[#10b981] rounded-t"
                  />
                </div>
                <span className="text-xs text-[#909090]">{data.month}</span>
                <span className="text-[10px] text-emerald-400">+{data.roi}%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#10b981] rounded" />
              <span className="text-xs text-[#909090]">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#10b981] opacity-60 rounded" />
              <span className="text-xs text-[#909090]">ROI %</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Analytics Component
export function Analytics() {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('30d')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab timeRange={timeRange} />
      case 'performance': return <PerformanceTab />
      case 'projections': return <ProjectionsTab />
      case 'roi': return <ROITab />
      case 'audience': return <AudienceTab />
      default: return <OverviewTab timeRange={timeRange} />
    }
  }

  return (
    <div className="pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#E8E8E8]">Analytics</h1>
            <p className="text-[#909090] mt-1">Track performance across all your channels</p>
          </div>
          <div className="flex items-center gap-3">
            <Dropdown 
              options={timeRanges}
              value={timeRange}
              onChange={setTimeRange}
            />
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs 
            tabs={analyticsTabs} 
            activeTab={activeTab} 
            onChange={setActiveTab}
            variant="default"
            size="md"
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
