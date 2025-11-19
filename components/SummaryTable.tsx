"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface SummaryTableProps {
  data: any;
}

export default function SummaryTable({ data }: SummaryTableProps) {
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

    const sumItem = items[0]; // SUM 데이터
    const achievement = sumItem.target > 0 ? Math.round((sumItem.forecast / sumItem.target) * 100) : 0;
    const growth = sumItem.lastYear > 0 ? Math.round(((sumItem.forecast - sumItem.lastYear) / sumItem.lastYear) * 100) : 0;

    let insights = [];
    
    // 달성률 분석
    if (achievement >= 110) {
      insights.push(`🎯 목표 대비 ${achievement}% 달성으로 매우 우수한 성과를 보이고 있습니다.`);
    } else if (achievement >= 100) {
      insights.push(`✅ 목표를 ${achievement}% 달성하여 안정적인 실적을 기록했습니다.`);
    } else if (achievement >= 90) {
      insights.push(`⚠️ 목표 달성률 ${achievement}%로 목표에 근접했으나, 추가 노력이 필요합니다.`);
    } else {
      insights.push(`🔴 목표 달성률이 ${achievement}%로 저조합니다. 전략 재검토가 필요합니다.`);
    }

    // 전년 대비 성장률 분석
    if (growth >= 10) {
      insights.push(`📈 전년 대비 ${growth}% 성장으로 강력한 상승세를 보이고 있습니다.`);
    } else if (growth >= 0) {
      insights.push(`📊 전년 대비 ${growth}% 성장으로 안정적인 성장세를 유지하고 있습니다.`);
    } else if (growth >= -10) {
      insights.push(`📉 전년 대비 ${growth}%로 소폭 감소했습니다. 시장 상황 점검이 필요합니다.`);
    } else {
      insights.push(`⚠️ 전년 대비 ${growth}%로 큰 폭 감소했습니다. 즉각적인 대응이 필요합니다.`);
    }

    // 개별 항목 분석 (SUM 제외)
    const detailItems = items.slice(1);
    if (detailItems.length > 0) {
      const topPerformer = detailItems.reduce((max, item) => {
        const itemAchievement = item.target > 0 ? (item.forecast / item.target) * 100 : 0;
        const maxAchievement = max.target > 0 ? (max.forecast / max.target) * 100 : 0;
        return itemAchievement > maxAchievement ? item : max;
      });
      
      const topAchievement = topPerformer.target > 0 ? Math.round((topPerformer.forecast / topPerformer.target) * 100) : 0;
      insights.push(`🏆 최고 실적: ${topPerformer.name} (${topAchievement}% 달성)`);
    }

    // 권장사항
    if (achievement < 100) {
      insights.push(`💡 권장사항: 목표 달성을 위해 ${Math.round((sumItem.target - sumItem.forecast) / 100000000)}억원의 추가 매출이 필요합니다.`);
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
                  <th className="px-6 py-4 text-left text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    구분
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    목표<br/>(억원)
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    예상마감<br/>(억원)
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    작년실적<br/>(억원)
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    달성률
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    전년대비
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayItems.map((item, index) => {
                  const isTotal = item.name?.includes('TTL') || item.name?.includes('SUM') || item.name?.includes('합계');
                  const achievement = item.target > 0 ? Math.round((item.forecast / item.target) * 100) : 0;
                  const growth = item.lastYear > 0 ? Math.round(((item.forecast - item.lastYear) / item.lastYear) * 100) : 0;

                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-blue-50 transition-colors ${
                        isTotal ? 'bg-gradient-to-r from-blue-100 to-blue-50 font-bold border-t-2 border-b-2 border-blue-200' : ''
                      }`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap ${isTotal ? 'text-base font-bold text-gray-900' : 'text-base text-gray-800'}`}>
                        {isTotal ? '📊 ' : ''}{item.name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right ${isTotal ? 'text-base font-bold text-green-700' : 'text-base text-gray-700'}`}>
                        {formatBillion(item.target)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right ${isTotal ? 'text-base font-bold text-blue-700' : 'text-base font-semibold text-gray-900'}`}>
                        {formatBillion(item.forecast)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right ${isTotal ? 'text-base font-bold text-gray-700' : 'text-base text-gray-600'}`}>
                        {formatBillion(item.lastYear)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getAchievementColor(achievement)}`}>
                          {formatPercent(achievement)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-base font-bold ${getGrowthColor(growth)}`}>
                          {growth >= 0 ? '+' : ''}{formatPercent(growth)}
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-xl p-8 mb-6 shadow-lg border-2 border-purple-200">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">📊 영업 실적 요약</h2>
        <p className="text-lg text-gray-700 font-medium">
          상권별, TEAM별, 유통별 목표 대비 실적 및 전년 대비 성장률
        </p>
      </div>

      {renderSection('🏢 상권별', 'area', data.byArea)}
      {renderSection('👥 TEAM별', 'team', data.byTeam)}
      {renderSection('🛍️ 유통별', 'channel', data.byChannel)}
    </div>
  );
}

