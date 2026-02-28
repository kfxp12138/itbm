import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface MBTIReportProps {
  type: string;
  typeName: string;
  epithet: string;
  description: string;
  counts: Record<string, number>;
  generalTraits: string[];
  strengths: string[];
  tenRulesToLive: string[];
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansSC',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  // Cover page styles
  coverHeader: {
    backgroundColor: '#7c3aed',
    marginHorizontal: -40,
    marginTop: -40,
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  coverHeaderAccent: {
    backgroundColor: '#8b5cf6',
    height: 8,
    marginHorizontal: -40,
    marginTop: -60,
  },
  coverTitle: {
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#e9d5ff',
    textAlign: 'center',
  },
  typeDisplay: {
    alignItems: 'center',
    marginTop: 60,
  },
  typeCode: {
    fontSize: 72,
    color: '#7c3aed',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  typeName: {
    fontSize: 24,
    color: '#4c1d95',
    marginTop: 16,
  },
  epithet: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 12,
    // fontStyle: 'italic', // NotoSansSC 不支持 italic 变体
  },
  dateContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Dimension analysis styles
  sectionTitle: {
    fontSize: 22,
    color: '#7c3aed',
    marginBottom: 24,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e9d5ff',
  },
  dimensionContainer: {
    marginBottom: 28,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dimensionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 'bold',
  },
  dimensionValue: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  barContainer: {
    flexDirection: 'row',
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  barLabelText: {
    fontSize: 10,
    color: '#6b7280',
  },
  // Content page styles
  descriptionText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.8,
    textAlign: 'left',
  },
  listContainer: {
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
    flexWrap: 'wrap',
  },
  listBullet: {
    width: 8,
    height: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 4,
  },
  listText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.6,
    flexWrap: 'wrap',
  },
  // Advice page styles
  adviceNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adviceNumberText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  adviceItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  adviceText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
    paddingTop: 4,
    flexWrap: 'wrap',
  },
  // Footer styles
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
    color: '#7c3aed',
  },
  // Two column layout
  twoColumn: {
    flexDirection: 'row',
    gap: 24,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    color: '#7c3aed',
    marginBottom: 16,
    fontWeight: 'bold',
  },
});

const dimensionLabels: Record<string, [string, string]> = {
  'E-I': ['外向 (E)', '内向 (I)'],
  'S-N': ['感觉 (S)', '直觉 (N)'],
  'T-F': ['思考 (T)', '情感 (F)'],
  'J-P': ['判断 (J)', '知觉 (P)'],
};

function calculatePercentage(counts: Record<string, number>, dim: string): number {
  const [left, right] = dim.split('-');
  const leftCount = counts[left] || 0;
  const rightCount = counts[right] || 0;
  const total = leftCount + rightCount;
  if (total === 0) return 50;
  return Math.round((leftCount / total) * 100);
}

function Footer({ pageNum }: { pageNum: number }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>心理测试平台 — xinli-test.com</Text>
      <Text style={styles.pageNumber}>第 {pageNum} 页</Text>
    </View>
  );
}

export function MBTIReport({
  type,
  typeName,
  epithet,
  description,
  counts,
  generalTraits,
  strengths,
  tenRulesToLive,
}: MBTIReportProps) {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dimensions = ['E-I', 'S-N', 'T-F', 'J-P'];

  return (
    <Document>
      {/* Page 1: Cover */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverHeaderAccent} />
        <View style={styles.coverHeader}>
          <Text style={styles.coverTitle}>MBTI人格测试报告</Text>
          <Text style={styles.coverSubtitle}>迈尔斯-布里格斯类型指标 · 专业版</Text>
        </View>
        <View style={styles.typeDisplay}>
          <Text style={styles.typeCode}>{type}</Text>
          <Text style={styles.typeName}>{typeName}</Text>
          <Text style={styles.epithet}>「{epithet}」</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>测试日期：{today}</Text>
        </View>
        <Footer pageNum={1} />
      </Page>

      {/* Page 2: Dimension Analysis */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>维度分析</Text>
        {dimensions.map((dim) => {
          const percentage = calculatePercentage(counts, dim);
          const [leftLabel, rightLabel] = dimensionLabels[dim];
          const dominant = percentage >= 50 ? leftLabel : rightLabel;
          return (
            <View key={dim} style={styles.dimensionContainer}>
              <View style={styles.dimensionHeader}>
                <Text style={styles.dimensionLabel}>{dim.replace('-', ' vs ')}</Text>
                <Text style={styles.dimensionValue}>{dominant} ({percentage >= 50 ? percentage : 100 - percentage}%)</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
              </View>
              <View style={styles.barLabels}>
                <Text style={styles.barLabelText}>{leftLabel}</Text>
                <Text style={styles.barLabelText}>{rightLabel}</Text>
              </View>
            </View>
          );
        })}
        <Footer pageNum={2} />
      </Page>

      {/* Page 3: Personality Description */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>人格特征描述</Text>
        <Text style={styles.descriptionText}>{description}</Text>
        <Footer pageNum={3} />
      </Page>

      {/* Page 4: Traits */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>性格特点</Text>
        <View style={styles.listContainer}>
          {generalTraits.map((trait, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listBullet} />
              <Text style={styles.listText}>{trait}</Text>
            </View>
          ))}
        </View>
        <Footer pageNum={4} />
      </Page>

      {/* Page 5: Strengths */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>优势特长</Text>
        <View style={styles.listContainer}>
          {strengths.map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listBullet} />
              <Text style={styles.listText}>{strength}</Text>
            </View>
          ))}
        </View>
        <Footer pageNum={5} />
      </Page>

      {/* Page 6: Life Advice */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>生活建议</Text>
        <View style={styles.listContainer}>
          {tenRulesToLive.map((rule, index) => (
            <View key={index} style={styles.adviceItem}>
              <View style={styles.adviceNumber}>
                <Text style={styles.adviceNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.adviceText}>{rule}</Text>
            </View>
          ))}
        </View>
        <Footer pageNum={6} />
      </Page>
    </Document>
  );
}
