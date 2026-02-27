import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface CareerReportProps {
  mbtiType: string;
  mbtiTypeName: string;
  ffmScores: Array<{ trait: string; percentage: number }>;
  careers: string[];
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansSC',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  // Cover header
  coverHeader: {
    backgroundColor: '#059669',
    marginHorizontal: -40,
    marginTop: -40,
    paddingVertical: 50,
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  headerAccent: {
    backgroundColor: '#10b981',
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
    color: '#a7f3d0',
    textAlign: 'center',
  },
  // MBTI type display
  typeSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  typeBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 3,
    borderColor: '#059669',
    borderRadius: 16,
    paddingHorizontal: 48,
    paddingVertical: 24,
    alignItems: 'center',
  },
  typeCode: {
    fontSize: 48,
    color: '#059669',
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  typeName: {
    fontSize: 18,
    color: '#047857',
    marginTop: 8,
  },
  // Section title
  sectionTitle: {
    fontSize: 20,
    color: '#059669',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#d1fae5',
  },
  // FFM trait bars
  traitContainer: {
    marginBottom: 20,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  traitName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 'bold',
  },
  traitPercent: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  traitBarBg: {
    height: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  traitBarFill: {
    height: 20,
    backgroundColor: '#059669',
    borderRadius: 10,
  },
  traitDescription: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  // Career grid
  careerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  careerItem: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: '45%',
  },
  careerText: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'center',
  },
  // Info box
  infoBox: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  infoText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.7,
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
    color: '#059669',
  },
  // Date
  dateContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

const traitDescriptions: Record<string, string> = {
  '开放性': '对新体验、创意和抽象思维的接受程度',
  '尽责性': '自律、组织能力和目标导向的程度',
  '外向性': '社交活跃度和从外部世界获取能量的倾向',
  '宜人性': '合作、信任和关心他人的程度',
  '神经质': '情绪稳定性和应对压力的能力（分数越低越稳定）',
};

function Footer({ pageNum }: { pageNum: number }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>心理测试平台 — xinli-test.com</Text>
      <Text style={styles.pageNumber}>第 {pageNum} 页</Text>
    </View>
  );
}

export function CareerReport({
  mbtiType,
  mbtiTypeName,
  ffmScores,
  careers,
}: CareerReportProps) {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Split careers into two pages if more than 12
  const careersPage1 = careers.slice(0, 12);
  const careersPage2 = careers.slice(12);

  return (
    <Document>
      {/* Page 1: Cover + MBTI Type */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerAccent} />
        <View style={styles.coverHeader}>
          <Text style={styles.coverTitle}>职业性格测试报告</Text>
          <Text style={styles.coverSubtitle}>基于大五人格与MBTI · 职业规划指南</Text>
        </View>

        <View style={styles.typeSection}>
          <View style={styles.typeBox}>
            <Text style={styles.typeCode}>{mbtiType}</Text>
            <Text style={styles.typeName}>{mbtiTypeName}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            本报告基于大五人格模型（FFM）和迈尔斯-布里格斯类型指标（MBTI）综合分析您的职业性格特征。
            通过科学的心理测评，为您提供个性化的职业发展建议，帮助您找到最适合自己的职业方向。
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>测试日期：{today}</Text>
        </View>

        <Footer pageNum={1} />
      </Page>

      {/* Page 2: FFM Analysis */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>大五人格分析</Text>

        {ffmScores.map((item, index) => (
          <View key={index} style={styles.traitContainer}>
            <View style={styles.traitHeader}>
              <Text style={styles.traitName}>{item.trait}</Text>
              <Text style={styles.traitPercent}>{item.percentage}%</Text>
            </View>
            <View style={styles.traitBarBg}>
              <View style={[styles.traitBarFill, { width: `${item.percentage}%` }]} />
            </View>
            <Text style={styles.traitDescription}>
              {traitDescriptions[item.trait] || ''}
            </Text>
          </View>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            大五人格模型是心理学中最广泛接受的人格理论之一，通过五个核心维度全面描述个体的人格特征。
            每个维度的得分反映了您在该特质上的相对位置，没有绝对的好坏之分。
          </Text>
        </View>

        <Footer pageNum={2} />
      </Page>

      {/* Page 3: Career Recommendations */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>推荐职业方向</Text>

        <View style={styles.careerGrid}>
          {careersPage1.map((career, index) => (
            <View key={index} style={styles.careerItem}>
              <Text style={styles.careerText}>{career}</Text>
            </View>
          ))}
        </View>

        {careersPage2.length === 0 && (
          <View style={[styles.infoBox, { marginTop: 40 }]}>
            <Text style={styles.infoText}>
              以上职业推荐基于您的人格特征分析得出。这些职业方向与您的性格特点高度匹配，
              但最终的职业选择还需结合您的兴趣、技能、教育背景和市场需求综合考虑。
              建议您深入了解感兴趣的职业，并通过实习或志愿工作获取实际体验。
            </Text>
          </View>
        )}

        <Footer pageNum={3} />
      </Page>

      {/* Page 4: More careers if needed */}
      {careersPage2.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>更多推荐职业</Text>

          <View style={styles.careerGrid}>
            {careersPage2.map((career, index) => (
              <View key={index} style={styles.careerItem}>
                <Text style={styles.careerText}>{career}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.infoBox, { marginTop: 40 }]}>
            <Text style={styles.infoText}>
              以上职业推荐基于您的人格特征分析得出。这些职业方向与您的性格特点高度匹配，
              但最终的职业选择还需结合您的兴趣、技能、教育背景和市场需求综合考虑。
              建议您深入了解感兴趣的职业，并通过实习或志愿工作获取实际体验。
            </Text>
          </View>

          <Footer pageNum={4} />
        </Page>
      )}
    </Document>
  );
}
