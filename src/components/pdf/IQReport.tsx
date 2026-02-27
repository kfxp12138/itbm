import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface IQReportProps {
  score: number;
  correctCount: number;
  age: number;
  level: string;
  description: string;
  timestamp: number;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansSC',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  // Cover header
  coverHeader: {
    backgroundColor: '#4f46e5',
    marginHorizontal: -40,
    marginTop: -40,
    paddingVertical: 50,
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  headerAccent: {
    backgroundColor: '#6366f1',
    height: 6,
    marginHorizontal: -40,
    marginTop: -50,
  },
  coverTitle: {
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#c7d2fe',
    textAlign: 'center',
  },
  // Score display
  scoreSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#eef2ff',
    borderWidth: 8,
    borderColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 64,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 24,
  },
  levelText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Description
  descriptionBox: {
    backgroundColor: '#f5f3ff',
    padding: 24,
    borderRadius: 12,
    marginTop: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
  },
  descriptionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.8,
  },
  // Stats section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  // Interpretation guide
  sectionTitle: {
    fontSize: 20,
    color: '#4f46e5',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e7ff',
  },
  guideContainer: {
    marginTop: 20,
  },
  guideRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  guideRange: {
    width: 100,
    fontSize: 12,
    color: '#374151',
    fontWeight: 'bold',
  },
  guideBar: {
    flex: 1,
    height: 24,
    marginHorizontal: 12,
    borderRadius: 4,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  guideLabel: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  guidePercent: {
    width: 60,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  // Marker for current score
  currentMarker: {
    position: 'absolute',
    right: 8,
    top: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentMarkerText: {
    fontSize: 9,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 10,
    color: '#4f46e5',
  },
});

const iqRanges = [
  { min: 130, max: 200, label: '非常优秀', color: '#059669', percent: '2.2%' },
  { min: 120, max: 129, label: '优秀', color: '#10b981', percent: '6.7%' },
  { min: 110, max: 119, label: '中上', color: '#4f46e5', percent: '16.1%' },
  { min: 90, max: 109, label: '中等', color: '#6366f1', percent: '50%' },
  { min: 80, max: 89, label: '中下', color: '#f59e0b', percent: '16.1%' },
  { min: 70, max: 79, label: '边缘', color: '#f97316', percent: '6.7%' },
  { min: 0, max: 69, label: '需关注', color: '#ef4444', percent: '2.2%' },
];

function Footer({ pageNum }: { pageNum: number }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>心理测试平台 — xinli-test.com</Text>
      <Text style={styles.pageNumber}>第 {pageNum} 页</Text>
    </View>
  );
}

export function IQReport({
  score,
  correctCount,
  age,
  level,
  description,
  timestamp,
}: IQReportProps) {
  const testDate = new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isInRange = (s: number, min: number, max: number) => s >= min && s <= max;

  return (
    <Document>
      {/* Page 1: Cover + Score */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerAccent} />
        <View style={styles.coverHeader}>
          <Text style={styles.coverTitle}>智商测试报告</Text>
          <Text style={styles.coverSubtitle}>瑞文标准推理测验 · 专业评估</Text>
        </View>

        <View style={styles.scoreSection}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreLabel}>IQ 分数</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
        </View>

        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{correctCount}</Text>
            <Text style={styles.statLabel}>正确题数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{age}</Text>
            <Text style={styles.statLabel}>测试年龄</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>60</Text>
            <Text style={styles.statLabel}>总题数</Text>
          </View>
        </View>

        <Footer pageNum={1} />
      </Page>

      {/* Page 2: Score Interpretation */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>分数解读指南</Text>
        
        <View style={styles.guideContainer}>
          {iqRanges.map((range, index) => (
            <View key={index} style={styles.guideRow}>
              <Text style={styles.guideRange}>
                {range.min === 0 ? `< ${range.max + 1}` : range.max === 200 ? `≥ ${range.min}` : `${range.min} - ${range.max}`}
              </Text>
              <View style={[styles.guideBar, { backgroundColor: range.color }]}>
                <Text style={styles.guideLabel}>{range.label}</Text>
                {isInRange(score, range.min, range.max) && (
                  <View style={styles.currentMarker}>
                    <Text style={styles.currentMarkerText}>您的分数</Text>
                  </View>
                )}
              </View>
              <Text style={styles.guidePercent}>{range.percent}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.descriptionBox, { marginTop: 40 }]}>
          <Text style={styles.descriptionText}>
            智商（IQ）分数基于瑞文标准推理测验计算，该测验主要评估抽象推理能力和流体智力。
            分数采用标准化计算方法，平均值为100，标准差为15。上表显示了各分数段在人群中的分布比例。
          </Text>
        </View>

        <View style={[styles.statsContainer, { marginTop: 40 }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{testDate}</Text>
            <Text style={styles.statLabel}>测试日期</Text>
          </View>
        </View>

        <Footer pageNum={2} />
      </Page>
    </Document>
  );
}
