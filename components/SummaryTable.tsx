"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface SummaryTableProps {
  data: any;
  weeklyMeetingData?: any;
}

export default function SummaryTable({ data, weeklyMeetingData }: SummaryTableProps) {
  // 기본값: 상권별, TEAM별, 유통별은 펼쳐진 상태
  const [expandedSections, setExpandedSections] = useState<string[]>(['area', 'team', 'channel']);
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
    // 데이터가 없어도 섹션은 표시 (데이터 없음 메시지)
    if (!items || items.length === 0) {
      return (
        <div className="mb-6 bg-white rounded-xl shadow-xl overflow-hidden border-2 border-gray-200">
          <div className="w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-between">
            <span className="text-white font-extrabold text-xl">{title}</span>
            <span className="text-white/80 text-sm">데이터 없음</span>
          </div>
        </div>
      );
    }

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
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-orange-900 uppercase tracking-wider bg-orange-50">
                    11월<br/>매출목표<br/>(억원)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-50">
                    Actual<br/>MTD<br/>(억원)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-gray-700 uppercase tracking-wider bg-blue-50">
                    LY<br/>Actual<br/>(억원)
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-50">
                    전년비<br/>(%)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-extrabold text-purple-900 uppercase tracking-wider bg-purple-50">
                    Sales<br/>FCST<br/>(억원)
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-extrabold text-purple-900 uppercase tracking-wider bg-purple-50">
                    예상<br/>마감율<br/>(%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayItems.map((item, index) => {
                  const isTotal = item.name?.includes('TTL') || item.name?.includes('SUM') || item.name?.includes('합계');
                  
                  // 11월 매출목표 (target은 연간이지만, 11월 목표로 사용)
                  // 실제로는 item.novemberTarget이 있을 수도 있지만, 일단 target 사용
                  const novemberTarget = item.novemberTarget || item.target || 0;
                  
                  // Actual MTD (11월 현재까지 실적)
                  const actualMTD = item.actualMTD || item.periodPerformance || 0;
                  
                  // LY Actual (작년 11월 실적)
                  const lyActual = item.lyActual || item.lastYearPeriod || item.lastYear || 0;
                  
                  // 전년비 = ((Actual MTD - LY Actual) / LY Actual) × 100
                  const growthRate = lyActual > 0 ? Math.round(((actualMTD - lyActual) / lyActual) * 100) : 0;
                  
                  // Sales FCST (예상마감)
                  const salesFCST = item.forecast || item.salesFCST || 0;
                  
                  // 예상마감율 = (Sales FCST / 11월 매출목표) × 100
                  const forecastRate = novemberTarget > 0 ? Math.round((salesFCST / novemberTarget) * 100) : 0;

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
                      <td className={`px-3 py-3 whitespace-nowrap text-right bg-orange-50 ${isTotal ? 'text-sm font-bold text-orange-800' : 'text-sm text-gray-700'}`}>
                        {formatBillion(novemberTarget)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right bg-blue-50 ${isTotal ? 'text-sm font-bold text-blue-800' : 'text-sm font-semibold text-blue-700'}`}>
                        {formatBillion(actualMTD)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right bg-blue-50 ${isTotal ? 'text-sm font-bold text-gray-700' : 'text-sm text-gray-600'}`}>
                        {formatBillion(lyActual)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center bg-blue-50">
                        <span className={`text-sm font-bold ${getGrowthColor(growthRate)}`}>
                          {growthRate >= 0 ? '+' : ''}{formatPercent(growthRate)}
                        </span>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right bg-purple-50 ${isTotal ? 'text-sm font-bold text-purple-800' : 'text-sm font-semibold text-purple-700'}`}>
                        {formatBillion(salesFCST)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center bg-purple-50">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getAchievementColor(forecastRate)}`}>
                          {formatPercent(forecastRate)}
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
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-indigo-200 hover:border-indigo-400 transition-all">
        {/* 헤더 */}
        <div 
          className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all"
          onClick={() => toggleSection('weekly-meeting')}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="text-2xl font-black text-white drop-shadow-md">주간회의</h3>
              <span className="text-sm text-white/90 font-medium bg-white/20 px-4 py-1 rounded-full mt-1 inline-block">
                {weeklyMeetingData.period}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAiInsight('weekly-meeting');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-lg text-sm font-bold"
            >
              <Sparkles className="w-5 h-5" />
              AI 인사이트
            </button>
            <div className="bg-white/20 rounded-full p-2">
              {isExpanded ? (
                <ChevronUp className="w-7 h-7 text-white" />
              ) : (
                <ChevronDown className="w-7 h-7 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* AI 인사이트 */}
        {isExpanded && showAiInsight && insights && (
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-8 border-b-4 border-purple-300">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-3 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-black text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🤖 AI 분석 결과</h4>
                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className="bg-white rounded-xl p-5 shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow"
                    >
                      <p className="text-base text-gray-800 leading-relaxed font-medium">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 테이블 */}
        {isExpanded && (
          <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 space-y-10">
            {/* 상권별 */}
            {weeklyMeetingData.rawData.상권 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-blue-200">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                  <h4 className="text-xl font-black text-white flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    상권별 실적
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-blue-100 to-cyan-100">
                      <tr>
                        <th className="px-4 py-4 text-center text-xs font-black text-gray-800 uppercase border-r-2 border-blue-300" rowSpan={2}>
                          상권
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-black text-blue-900 uppercase border-r-2 border-blue-300" colSpan={6}>
                          📊 25년 누계
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-black text-blue-900 uppercase border-r-2 border-blue-300" colSpan={8}>
                          📅 11월
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-black text-blue-900 uppercase" colSpan={4}>
                          📌 46주차
                        </th>
                      </tr>
                      <tr>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-blue-50 border-r border-blue-200">목표</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-blue-50 border-r border-blue-200">금년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-blue-50 border-r border-blue-200">전년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-blue-50 border-r border-blue-200">성장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-blue-50 border-r border-blue-200">달성율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-blue-50 border-r-2 border-blue-300">기존점 신장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-cyan-50 border-r border-blue-200">목표</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-cyan-50 border-r border-blue-200">금년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-cyan-50 border-r border-blue-200">전년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-cyan-50 border-r border-blue-200">성장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-cyan-50 border-r border-blue-200">달성율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-cyan-50 border-r border-blue-200">기존점 신장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-cyan-50 border-r border-blue-200">순수 신장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 bg-indigo-50 border-r-2 border-blue-300">단체비중</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-blue-200">금년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-blue-200">전년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-blue-200">성장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 bg-indigo-50">단체비중</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-blue-100">
                      {weeklyMeetingData.rawData.상권.map((item: any, idx: number) => (
                        <tr key={idx} className={`${item.name === '합계' ? 'bg-gradient-to-r from-blue-200 to-cyan-200 font-black text-gray-900' : 'hover:bg-blue-50'} transition-colors`}>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 border-r-2 border-blue-200">{item.name}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-blue-50/50 border-r border-blue-100">{item.yearlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-blue-900 font-semibold bg-blue-50/50 border-r border-blue-100">{item.yearlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-blue-50/50 border-r border-blue-100">{item.yearlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-blue-50/50 border-r border-blue-100 ${(item.yearlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyGrowthRate !== undefined ? `${(item.yearlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-blue-50/50 border-r border-blue-100 ${(item.yearlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.yearlyAchievementRate !== undefined ? `${(item.yearlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-blue-50/50 border-r-2 border-blue-200 ${(item.yearlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyExistingGrowth !== undefined ? `${(item.yearlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-cyan-50/50 border-r border-blue-100">{item.monthlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-cyan-900 font-semibold bg-cyan-50/50 border-r border-blue-100">{item.monthlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-cyan-50/50 border-r border-blue-100">{item.monthlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-cyan-50/50 border-r border-blue-100 ${(item.monthlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyGrowthRate !== undefined ? `${(item.monthlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-cyan-50/50 border-r border-blue-100 ${(item.monthlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.monthlyAchievementRate !== undefined ? `${(item.monthlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-cyan-50/50 border-r border-blue-100 ${(item.monthlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyExistingGrowth !== undefined ? `${(item.monthlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-cyan-50/50 border-r border-blue-100 ${(item.monthlyPureGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyPureGrowth !== undefined ? `${(item.monthlyPureGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-indigo-700 font-black bg-indigo-50/50 border-r-2 border-blue-200">
                            {item.monthlyGroupRatio !== undefined ? `${(item.monthlyGroupRatio * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-purple-900 font-semibold bg-purple-50/50 border-r border-blue-100">{item.weeklyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-purple-50/50 border-r border-blue-100">{item.weeklyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-purple-50/50 border-r border-blue-100 ${(item.weeklyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.weeklyGrowthRate !== undefined ? `${(item.weeklyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-indigo-700 font-black bg-indigo-50/50">
                            {item.weeklyGroupRatio !== undefined ? `${(item.weeklyGroupRatio * 100).toFixed(1)}%` : '-'}
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
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-purple-200">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h4 className="text-xl font-black text-white flex items-center gap-3">
                    <span className="text-2xl">🏬</span>
                    채널별 실적
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-purple-100 to-pink-100">
                      <tr>
                        <th className="px-4 py-4 text-center text-xs font-black text-gray-800 uppercase border-r-2 border-purple-300" rowSpan={2}>
                          채널
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-black text-purple-900 uppercase border-r-2 border-purple-300" colSpan={6}>
                          📊 25년 누계
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-black text-purple-900 uppercase border-r-2 border-purple-300" colSpan={8}>
                          📅 11월
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-black text-purple-900 uppercase" colSpan={4}>
                          📌 46주차
                        </th>
                      </tr>
                      <tr>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-purple-200">목표</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-purple-200">금년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-purple-200">전년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-purple-200">성장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r border-purple-200">달성율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-purple-50 border-r-2 border-purple-300">기존점 신장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-pink-50 border-r border-purple-200">목표</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-pink-50 border-r border-purple-200">금년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-pink-50 border-r border-purple-200">전년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-pink-50 border-r border-purple-200">성장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-pink-50 border-r border-purple-200">달성율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-pink-50 border-r border-purple-200">기존점 신장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-pink-50 border-r border-purple-200">순수 신장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 bg-indigo-50 border-r-2 border-purple-300">단체비중</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-rose-50 border-r border-purple-200">금년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-rose-50 border-r border-purple-200">전년</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 bg-rose-50 border-r border-purple-200">성장율</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 bg-indigo-50">단체비중</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-purple-100">
                      {weeklyMeetingData.rawData.채널.map((item: any, idx: number) => (
                        <tr key={idx} className={`${item.name === '합계' ? 'bg-gradient-to-r from-purple-200 to-pink-200 font-black text-gray-900' : 'hover:bg-purple-50'} transition-colors`}>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 border-r-2 border-purple-200">{item.name}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-purple-50/50 border-r border-purple-100">{item.yearlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-purple-900 font-semibold bg-purple-50/50 border-r border-purple-100">{item.yearlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-purple-50/50 border-r border-purple-100">{item.yearlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-purple-50/50 border-r border-purple-100 ${(item.yearlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyGrowthRate !== undefined ? `${(item.yearlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-purple-50/50 border-r border-purple-100 ${(item.yearlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.yearlyAchievementRate !== undefined ? `${(item.yearlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-purple-50/50 border-r-2 border-purple-200 ${(item.yearlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.yearlyExistingGrowth !== undefined ? `${(item.yearlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-pink-50/50 border-r border-purple-100">{item.monthlyTarget?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-pink-900 font-semibold bg-pink-50/50 border-r border-purple-100">{item.monthlyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-pink-50/50 border-r border-purple-100">{item.monthlyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-pink-50/50 border-r border-purple-100 ${(item.monthlyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyGrowthRate !== undefined ? `${(item.monthlyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-pink-50/50 border-r border-purple-100 ${(item.monthlyAchievementRate || 0) >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.monthlyAchievementRate !== undefined ? `${(item.monthlyAchievementRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-pink-50/50 border-r border-purple-100 ${(item.monthlyExistingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyExistingGrowth !== undefined ? `${(item.monthlyExistingGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-pink-50/50 border-r border-purple-100 ${(item.monthlyPureGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.monthlyPureGrowth !== undefined ? `${(item.monthlyPureGrowth * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-indigo-700 font-black bg-indigo-50/50 border-r-2 border-purple-200">
                            {item.monthlyGroupRatio !== undefined ? `${(item.monthlyGroupRatio * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-rose-900 font-semibold bg-rose-50/50 border-r border-purple-100">{item.weeklyActual?.toLocaleString() || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right text-gray-700 bg-rose-50/50 border-r border-purple-100">{item.weeklyLastYear?.toLocaleString() || '-'}</td>
                          <td className={`px-3 py-3 text-sm text-right font-bold bg-rose-50/50 border-r border-purple-100 ${(item.weeklyGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.weeklyGrowthRate !== undefined ? `${(item.weeklyGrowthRate * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-indigo-700 font-black bg-indigo-50/50">
                            {item.weeklyGroupRatio !== undefined ? `${(item.weeklyGroupRatio * 100).toFixed(1)}%` : '-'}
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
