"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface SummaryTableProps {
  data: any;
  weeklyMeetingData?: any;
}

export default function SummaryTable({ data, weeklyMeetingData }: SummaryTableProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]); // 기본값: 모두 접힌 상태
  const [aiInsights, setAiInsights] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter(s => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };

  const toggleAiInsight = (section: string) => {
    setAiInsights(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // AI 인사이트 생성
  const generateAiInsight = (sectionKey: string, items: any[]) => {
    if (!items || items.length === 0) return null;

    const sumItem = items.find(item => item.name?.includes('TTL') || item.name?.includes('SUM') || item.name?.includes('합계')) || items[0]; // TTL 데이터
    
    // 진도율 = (올해 기간실적 / 목표) × 100
    const progressRate = sumItem.target > 0 ? Math.round((sumItem.periodPerformance / sumItem.target) * 100) : 0;
    
    // 기간실적 전년비
    const periodGrowth = sumItem.periodGrowthRate || 0;
    
    // 예상달성률 = (예상마감 / 목표) × 100
    const forecastAchievement = sumItem.target > 0 ? Math.round((sumItem.forecast / sumItem.target) * 100) : 0;
    
    // 예상전년비
    const forecastGrowth = sumItem.forecastGrowthRate || 0;

    let insights = [];
    
    // 진도율 분석
    if (progressRate >= 90) {
      insights.push(`🎯 현재 진도율 ${progressRate}%로 목표 달성이 거의 확실합니다!`);
    } else if (progressRate >= 70) {
      insights.push(`✅ 현재 진도율 ${progressRate}%로 양호한 진행 상황입니다.`);
    } else if (progressRate >= 50) {
      insights.push(`⚠️ 현재 진도율 ${progressRate}%로 목표 달성을 위해 추가 노력이 필요합니다.`);
    } else {
      insights.push(`🔴 현재 진도율이 ${progressRate}%로 저조합니다. 즉각적인 대응이 필요합니다.`);
    }

    // 기간실적 전년비 분석
    if (periodGrowth >= 10) {
      insights.push(`📈 기간실적 전년비 ${periodGrowth >= 0 ? '+' : ''}${periodGrowth}%로 강력한 성장세를 보이고 있습니다.`);
    } else if (periodGrowth >= 0) {
      insights.push(`📊 기간실적 전년비 ${periodGrowth >= 0 ? '+' : ''}${periodGrowth}%로 안정적인 성장세를 유지하고 있습니다.`);
    } else if (periodGrowth >= -10) {
      insights.push(`📉 기간실적 전년비 ${periodGrowth}%로 소폭 감소했습니다. 시장 상황 점검이 필요합니다.`);
    } else {
      insights.push(`⚠️ 기간실적 전년비 ${periodGrowth}%로 큰 폭 감소했습니다. 즉각적인 대응이 필요합니다.`);
    }

    // 예상달성률 분석
    if (forecastAchievement >= 110) {
      insights.push(`🚀 예상달성률 ${forecastAchievement}%로 목표를 초과 달성할 전망입니다!`);
    } else if (forecastAchievement >= 100) {
      insights.push(`✨ 예상달성률 ${forecastAchievement}%로 목표 달성이 예상됩니다.`);
    } else if (forecastAchievement >= 90) {
      insights.push(`💡 예상달성률 ${forecastAchievement}%로 목표에 근접할 전망입니다.`);
    } else {
      insights.push(`⚠️ 예상달성률 ${forecastAchievement}%로 목표 미달이 우려됩니다.`);
    }

    // 개별 항목 분석 (TTL 제외)
    const detailItems = items.filter(item => !(item.name?.includes('TTL') || item.name?.includes('SUM') || item.name?.includes('합계')));
    if (detailItems.length > 0) {
      const topPerformer = detailItems.reduce((max, item) => {
        const itemProgressRate = item.target > 0 ? (item.periodPerformance / item.target) * 100 : 0;
        const maxProgressRate = max.target > 0 ? (max.periodPerformance / max.target) * 100 : 0;
        return itemProgressRate > maxProgressRate ? item : max;
      });
      
      const topProgressRate = topPerformer.target > 0 ? Math.round((topPerformer.periodPerformance / topPerformer.target) * 100) : 0;
      const topForecastAchievement = topPerformer.target > 0 ? Math.round((topPerformer.forecast / topPerformer.target) * 100) : 0;
      insights.push(`🏆 최고 실적: ${topPerformer.name} (진도율 ${topProgressRate}%, 예상달성률 ${topForecastAchievement}%)`);
    }

    // 권장사항
    if (progressRate < 70) {
      const remainingAmount = Math.round((sumItem.target - sumItem.periodPerformance) / 100000000);
      insights.push(`💡 권장사항: 목표 달성을 위해 ${remainingAmount}억원의 추가 매출이 필요합니다. 현재 진도율을 고려하면 달성 가능성이 낮으므로 전략 재검토가 필요합니다.`);
    } else if (forecastAchievement < 100) {
      const additionalAmount = Math.round((sumItem.target - sumItem.forecast) / 100000000);
      insights.push(`💡 권장사항: 목표 달성을 위해 예상보다 ${additionalAmount}억원의 추가 매출이 필요합니다. 마지막 스퍼트를 준비하세요!`);
    } else {
      insights.push(`🎉 축하합니다! 현재 추세대로라면 목표를 초과 달성할 수 있습니다. 좋은 성과를 이어가세요!`);
    }

    return insights;
  };

  // 억 단위로 변환
  const formatBillion = (value: number) => {
    if (!value) return '0.0';
    const billion = (value / 100000000).toFixed(1);
    // 천단위 구분자 추가
    const parts = billion.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // 퍼센트 포맷
  const formatPercent = (value: number) => {
    if (!value && value !== 0) return '-';
    return `${value}%`;
  };

  // 성장률 색상
  const getGrowthColor = (value: number) => {
    if (!value && value !== 0) return 'text-gray-700';
    if (value >= 0) return 'text-blue-700';
    return 'text-red-700';
  };

  // 달성률 색상
  const getAchievementColor = (value: number) => {
    if (!value) return 'bg-gray-200 text-gray-700';
    if (value >= 100) return 'bg-green-500 text-white shadow-md';
    if (value >= 90) return 'bg-yellow-400 text-gray-900 shadow-md';
    return 'bg-red-500 text-white shadow-md';
  };

  const renderSection = (title: string, sectionKey: string, items: any[]) => {
    if (!items || items.length === 0) return null;

    const isExpanded = expandedSections.includes(sectionKey);
    const showAiInsight = aiInsights[sectionKey];
    
    // 모든 항목 표시 (21~27행 데이터)
    const displayItems = items;

    return (
      <div className="mb-6 bg-white rounded-xl shadow-xl overflow-hidden border-2 border-gray-200">
        <div className="w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-between">
          <button
            onClick={() => toggleSection(sectionKey)}
            className="flex items-center gap-3 text-white font-extrabold text-xl hover:opacity-90 transition-all"
          >
            <span>{title}</span>
            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
          
          <button
            onClick={() => toggleAiInsight(sectionKey)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md ${
              showAiInsight 
                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                : 'bg-white text-purple-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>AI</span>
          </button>
        </div>
        
        {/* AI 인사이트 영역 */}
        {showAiInsight && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-t-2 border-yellow-300 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 bg-yellow-400 rounded-full p-2">
                <Sparkles className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">AI 인사이트</h3>
                <p className="text-sm text-gray-600">데이터 기반 분석 및 권장사항</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {generateAiInsight(sectionKey, items)?.map((insight, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200"
                >
                  <p className="text-base text-gray-800 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider sticky left-0 bg-gray-100 z-10">
                    구분
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    목표<br/>(억원)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-50">
                    올해<br/>기간실적
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-gray-700 uppercase tracking-wider bg-blue-50">
                    작년<br/>기간실적
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-50">
                    진도율
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-50">
                    전년비
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-purple-900 uppercase tracking-wider bg-purple-50">
                    예상마감<br/>(억원)
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-extrabold text-purple-900 uppercase tracking-wider bg-purple-50">
                    예상<br/>달성률
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-extrabold text-purple-900 uppercase tracking-wider bg-purple-50">
                    예상<br/>전년비
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayItems.map((item, index) => {
                  const isTotal = item.name?.includes('TTL') || item.name?.includes('SUM') || item.name?.includes('합계');
                  
                  // 진도율 = (올해 기간실적 / 목표) × 100
                  const progressRate = item.target > 0 ? Math.round((item.periodPerformance / item.target) * 100) : 0;
                  
                  // 전년비 (기간실적) = item.periodGrowthRate (이미 계산됨)
                  const periodGrowth = item.periodGrowthRate || 0;
                  
                  // 예상달성률 = (예상마감 / 목표) × 100
                  const forecastAchievement = item.target > 0 ? Math.round((item.forecast / item.target) * 100) : 0;
                  
                  // 예상전년비 = item.forecastGrowthRate (이미 계산됨)
                  const forecastGrowth = item.forecastGrowthRate || 0;

                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-blue-50 transition-colors ${
                        isTotal ? 'bg-gradient-to-r from-blue-100 to-blue-50 font-bold border-t-2 border-b-2 border-blue-200' : ''
                      }`}
                    >
                      <td className={`px-4 py-3 whitespace-nowrap sticky left-0 bg-white ${isTotal ? 'text-sm font-bold text-gray-900 bg-blue-50' : 'text-sm text-gray-800'}`}>
                        {isTotal ? '📊 ' : ''}{item.name}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right ${isTotal ? 'text-sm font-bold text-green-700' : 'text-sm text-gray-700'}`}>
                        {formatBillion(item.target)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right bg-blue-50 ${isTotal ? 'text-sm font-bold text-blue-800' : 'text-sm font-semibold text-blue-700'}`}>
                        {formatBillion(item.periodPerformance)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right bg-blue-50 ${isTotal ? 'text-sm font-bold text-gray-700' : 'text-sm text-gray-600'}`}>
                        {formatBillion(item.lastYearPeriod)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center bg-blue-50">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getAchievementColor(progressRate)}`}>
                          {formatPercent(progressRate)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center bg-blue-50">
                        <span className={`text-sm font-bold ${getGrowthColor(periodGrowth)}`}>
                          {periodGrowth >= 0 ? '+' : ''}{formatPercent(periodGrowth)}
                        </span>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right bg-purple-50 ${isTotal ? 'text-sm font-bold text-purple-800' : 'text-sm font-semibold text-purple-700'}`}>
                        {formatBillion(item.forecast)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center bg-purple-50">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getAchievementColor(forecastAchievement)}`}>
                          {formatPercent(forecastAchievement)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center bg-purple-50">
                        <span className={`text-sm font-bold ${getGrowthColor(forecastGrowth)}`}>
                          {forecastGrowth >= 0 ? '+' : ''}{formatPercent(forecastGrowth)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // 주간회의 AI 인사이트 생성
  const generateWeeklyMeetingInsight = (rawData: any) => {
    if (!rawData || !rawData.상권 || !rawData.채널) return null;

    const totalArea = rawData.상권[0]; // 합계
    const totalChannel = rawData.채널[0]; // 합계

    let insights = [];

    // 25년 누계 분석
    const yearlyAchievement = (totalArea.yearlyAchievementRate || 0) * 100;
    if (yearlyAchievement >= 90) {
      insights.push(`🎯 25년 누계 달성률 ${yearlyAchievement.toFixed(1)}%로 목표 달성이 거의 확실합니다!`);
    } else if (yearlyAchievement >= 70) {
      insights.push(`✅ 25년 누계 달성률 ${yearlyAchievement.toFixed(1)}%로 양호한 진행 상황입니다.`);
    } else {
      insights.push(`⚠️ 25년 누계 달성률 ${yearlyAchievement.toFixed(1)}%로 목표 달성을 위해 추가 노력이 필요합니다.`);
    }

    // 11월 성장률 분석
    const monthlyGrowth = (totalArea.monthlyGrowthRate || 0) * 100;
    if (monthlyGrowth >= 10) {
      insights.push(`📈 11월 전년 대비 ${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%로 강력한 성장세입니다.`);
    } else if (monthlyGrowth >= 0) {
      insights.push(`📊 11월 전년 대비 ${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%로 안정적 성장세를 유지하고 있습니다.`);
    } else if (monthlyGrowth >= -10) {
      insights.push(`📉 11월 전년 대비 ${monthlyGrowth.toFixed(1)}%로 소폭 감소했습니다.`);
    } else {
      insights.push(`⚠️ 11월 전년 대비 ${monthlyGrowth.toFixed(1)}%로 큰 폭 감소했습니다. 즉각적인 대응이 필요합니다.`);
    }

    // 46주차 분석
    const weeklyGrowth = (totalArea.weeklyGrowthRate || 0) * 100;
    insights.push(`📅 46주차 전년 대비 ${weeklyGrowth >= 0 ? '+' : ''}${weeklyGrowth.toFixed(1)}%를 기록했습니다.`);

    // 상권별 최고 실적
    const bestArea = [...rawData.상권].slice(1).reduce((max, item) => {
      const maxRate = (max.monthlyGrowthRate || 0);
      const itemRate = (item.monthlyGrowthRate || 0);
      return itemRate > maxRate ? item : max;
    });
    insights.push(`🏆 상권별 최고 성장: ${bestArea.name} (11월 전년 대비 ${((bestArea.monthlyGrowthRate || 0) * 100).toFixed(1)}%)`);

    // 채널별 최고 실적
    const bestChannel = [...rawData.채널].slice(1).reduce((max, item) => {
      const maxRate = (max.monthlyGrowthRate || 0);
      const itemRate = (item.monthlyGrowthRate || 0);
      return itemRate > maxRate ? item : max;
    });
    insights.push(`🎯 채널별 최고 성장: ${bestChannel.name} (11월 전년 대비 ${((bestChannel.monthlyGrowthRate || 0) * 100).toFixed(1)}%)`);

    return insights;
  };

  // 주간회의 섹션 렌더링
  const renderWeeklyMeetingSection = () => {
    if (!weeklyMeetingData || !weeklyMeetingData.rawData) {
      return null;
    }

    const isExpanded = expandedSections.includes('weekly-meeting');
    const showAiInsight = aiInsights['weekly-meeting'];
    const insights = generateWeeklyMeetingInsight(weeklyMeetingData.rawData);

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-purple-300 transition-all">
        {/* 헤더 */}
        <div 
          className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
          onClick={() => toggleSection('weekly-meeting')}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <h3 className="text-xl font-bold text-gray-900">주간회의</h3>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
              {weeklyMeetingData.period}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAiInsight('weekly-meeting');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              AI 인사이트
            </button>
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-gray-600" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-600" />
            )}
          </div>
        </div>

        {/* AI 인사이트 */}
        {isExpanded && showAiInsight && insights && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b-2 border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="text-lg font-bold text-purple-900 mb-3">🤖 AI 분석 결과</h4>
                <ul className="space-y-2">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span className="flex-1">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 테이블 */}
        {isExpanded && (
          <div className="p-6 space-y-8">
            {/* 상권별 */}
            {weeklyMeetingData.rawData.상권 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">📍 상권별</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" rowSpan={2}>
                          상권
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" colSpan={6}>
                          25년 누계
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" colSpan={7}>
                          11월
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" colSpan={3}>
                          46주차
                        </th>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">목표</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">금년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">전년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">성장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">달성율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">기존점<br/>신장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">목표</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">금년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">전년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">성장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">달성율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">기존점<br/>신장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">순수<br/>신장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">금년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">전년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">성장율</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {weeklyMeetingData.rawData.상권.map((item: any, idx: number) => (
                        <tr key={idx} className={item.name === '합계' ? 'bg-blue-50 font-bold' : ''}>
                          <td className="px-4 py-3 text-sm text-gray-900 border">{item.name}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.yearlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-900 font-medium border">{item.yearlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.yearlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.yearlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyGrowthRate !== undefined ? `${(item.yearlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.yearlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.yearlyAchievementRate !== undefined ? `${(item.yearlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right border ${(item.yearlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyExistingGrowth !== undefined ? `${(item.yearlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.monthlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-900 font-medium border">{item.monthlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.monthlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.monthlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyGrowthRate !== undefined ? `${(item.monthlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.monthlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.monthlyAchievementRate !== undefined ? `${(item.monthlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right border ${(item.monthlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyExistingGrowth !== undefined ? `${(item.monthlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right border ${(item.monthlyPureGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyPureGrowth !== undefined ? `${(item.monthlyPureGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-gray-900 font-medium border">{item.weeklyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.weeklyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.weeklyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.weeklyGrowthRate !== undefined ? `${(item.weeklyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 채널별 */}
            {weeklyMeetingData.rawData.채널 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">🏬 채널별</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" rowSpan={2}>
                          채널
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" colSpan={6}>
                          25년 누계
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" colSpan={7}>
                          11월
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border" colSpan={3}>
                          46주차
                        </th>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">목표</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">금년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">전년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">성장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">달성율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">기존점<br/>신장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">목표</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">금년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">전년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">성장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">달성율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">기존점<br/>신장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">순수<br/>신장율</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">금년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">전년</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border">성장율</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {weeklyMeetingData.rawData.채널.map((item: any, idx: number) => (
                        <tr key={idx} className={item.name === '합계' ? 'bg-blue-50 font-bold' : ''}>
                          <td className="px-4 py-3 text-sm text-gray-900 border">{item.name}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.yearlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-900 font-medium border">{item.yearlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.yearlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.yearlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyGrowthRate !== undefined ? `${(item.yearlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.yearlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.yearlyAchievementRate !== undefined ? `${(item.yearlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right border ${(item.yearlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyExistingGrowth !== undefined ? `${(item.yearlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.monthlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-900 font-medium border">{item.monthlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.monthlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.monthlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyGrowthRate !== undefined ? `${(item.monthlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.monthlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.monthlyAchievementRate !== undefined ? `${(item.monthlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right border ${(item.monthlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyExistingGrowth !== undefined ? `${(item.monthlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right border ${(item.monthlyPureGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyPureGrowth !== undefined ? `${(item.monthlyPureGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-gray-900 font-medium border">{item.weeklyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 border">{item.weeklyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold border ${(item.weeklyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.weeklyGrowthRate !== undefined ? `${(item.weeklyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-xl p-8 mb-6 shadow-lg border-2 border-purple-200">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">📊 영업 실적 요약</h2>
        <p className="text-lg text-gray-700 font-medium mb-2">
          주간회의, 상권별, TEAM별, 유통별 목표 대비 실적 및 전년 대비 성장률
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
            📘 파란색: 기간실적 (진도율, 전년비)
          </span>
          <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-semibold">
            📙 보라색: 예상마감 (예상달성률, 예상전년비)
          </span>
        </div>
      </div>

      {renderWeeklyMeetingSection()}
      {renderSection('🏢 상권별', 'area', data.byArea)}
      {renderSection('👥 TEAM별', 'team', data.byTeam)}
      {renderSection('🛍️ 유통별', 'channel', data.byChannel)}
    </div>
  );
}

