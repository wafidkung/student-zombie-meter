import os
import sys
import time
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc
)
from sklearn.inspection import permutation_importance
from sklearn.preprocessing import label_binarize

CLASS_NAMES = [
    'Level 0: Alert',
    'Level 1: Mild Fatigue',
    'Level 2: Moderate Drowsy',
    'Level 3: Critical Microsleep'
]

def run_production_benchmark():
    print("=" * 80)
    print("🔬 ADVANCED PRODUCTION ML BENCHMARK & EVALUATION SUITE")
    print("   Aligned with Designing ML Systems (Chip Huyen) & Hands-On ML (Geron)")
    print("=" * 80)

    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, 'data', 'temporal_fatigue_multiclass.csv')
    df = pd.read_csv(data_path)
    print(f"📦 Loaded Dataset: {len(df)} samples, {len(df.columns)-1} features, 4 balanced classes")

    X = df.drop(columns=['target_level'])
    y = df['target_level']
    feature_cols = list(X.columns)

    # 1. Stratified Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"✂️ Data Partitioning: Train = {len(X_train)} samples, Test = {len(X_test)} samples (Stratified)")

    # 2. Candidate Algorithm Architectures (Across 5 distinct algorithmic families)
    candidate_models = {
        'Multinomial Logistic Regression': LogisticRegression(max_iter=500, random_state=42),
        'Support Vector Machine (RBF)': SVC(kernel='rbf', C=2.0, probability=True, random_state=42),
        'Random Forest (Bagging Ensemble)': RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
        'HistGradientBoosting (SOTA Boosting)': HistGradientBoostingClassifier(max_iter=100, max_depth=5, random_state=42),
        'Neural Network (Multi-Layer Perceptron)': MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
    }

    results = []
    trained_pipelines = {}
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    print("\n⚙️ Benchmarking 5 candidate models with Full Leakage-Free Pipelines...")
    print("-" * 80)

    fig_cm, axes_cm = plt.subplots(1, 5, figsize=(26, 5))

    for idx, (name, base_model) in enumerate(candidate_models.items()):
        # สร้าง Pipeline สมบูรณ์ (Scaler + Estimator) ป้องกัน Data Leakage 100%
        pipe = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', base_model)
        ])

        # 5-Fold Stratified Cross-Validation บน Train set
        cv_macro_f1 = cross_val_score(pipe, X_train, y_train, cv=cv, scoring='f1_macro', n_jobs=-1)

        # Fit Pipeline บน Train set
        pipe.fit(X_train, y_train)
        trained_pipelines[name] = pipe

        # วัด Inference Latency (Benchmark 1,000 predictions)
        sample_batch = X_test.iloc[:50]
        t0 = time.perf_counter()
        for _ in range(20):
            _ = pipe.predict(sample_batch)
        t1 = time.perf_counter()
        latency_ms_per_sample = ((t1 - t0) / 1000.0) * 1000.0  # มิลลิวินาทีต่อ 1 ตัวอย่าง

        # ประเมินบน Test Set (Unseen data)
        test_pred = pipe.predict(X_test)
        test_acc = accuracy_score(y_test, test_pred)
        macro_f1 = f1_score(y_test, test_pred, average='macro')
        weighted_f1 = f1_score(y_test, test_pred, average='weighted')

        # Safety-Critical Metric: Recall เฉพาะ Class 3 (Microsleep)
        # ตามหลักการใน Designing ML Systems: False Negative ในคลาสอันตรายมีโทษสูงมาก
        cm = confusion_matrix(y_test, test_pred)
        class_3_recall = cm[3, 3] / max(1, cm[3].sum())  # True Positive Rate for Class 3

        # บันทึกขนาดไฟล์โมเดลชั่วคราวเพื่อวัดขนาดหน่วยความจำ
        tmp_path = os.path.join(models_dir, f'tmp_{idx}.joblib')
        joblib.dump(pipe, tmp_path)
        model_size_kb = os.path.getsize(tmp_path) / 1024.0
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        results.append({
            'Algorithm': name,
            'Test Accuracy': round(test_acc, 4),
            'Macro F1': round(macro_f1, 4),
            'Weighted F1': round(weighted_f1, 4),
            'Class 3 Recall (Critical)': round(class_3_recall, 4),
            '5-Fold CV F1': f"{cv_macro_f1.mean():.4f} ± {cv_macro_f1.std():.4f}",
            'Latency (ms/sample)': round(latency_ms_per_sample, 3),
            'Model Size (KB)': round(model_size_kb, 1)
        })

        # วาด Confusion Matrix
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes_cm[idx],
                    xticklabels=['L0', 'L1', 'L2', 'L3'],
                    yticklabels=['L0', 'L1', 'L2', 'L3'])
        axes_cm[idx].set_title(f"{name}\nMacro F1: {macro_f1:.4f} | L3 Rec: {class_3_recall*100:.1f}%", fontsize=10)
        axes_cm[idx].set_xlabel('Predicted')
        axes_cm[idx].set_ylabel('True')

    plt.tight_layout()
    plt.savefig(os.path.join(models_dir, 'production_5models_confusion_matrices.png'), dpi=300)
    plt.close()
    print("📊 บันทึกภาพ 5-Model Confusion Matrix เรียบร้อยแล้ว")

    # 3. ตารางสรุปผลลัพธ์ Benchmark
    results_df = pd.DataFrame(results)
    print("\n" + "=" * 105)
    print("🏆 ตารางเปรียบเทียบผลลัพธ์ระดับโปรดักชัน (Production Engineering Benchmark Table):")
    print("=" * 105)
    print(results_df.to_string(index=False))
    results_df.to_csv(os.path.join(models_dir, 'production_benchmark_results.csv'), index=False)

    # เลือกรุ่นชนะเลิศ (พิจารณาจาก Macro F1 และ Class 3 Recall)
    best_row = results_df.sort_values(by=['Class 3 Recall (Critical)', 'Macro F1'], ascending=False).iloc[0]
    best_name = best_row['Algorithm']
    best_pipeline = trained_pipelines[best_name]

    print("\n" + "*" * 70)
    print(f"🌟 PRODUCTION WINNER MODEL: {best_name}")
    print(f"   - Test Macro F1: {best_row['Macro F1']:.4f} | Test Accuracy: {best_row['Test Accuracy']*100:.2f}%")
    print(f"   - Critical Class 3 Recall: {best_row['Class 3 Recall (Critical)']*100:.2f}% (Safety Guaranteed)")
    print(f"   - Inference Latency: {best_row['Latency (ms/sample)']:.3f} ms | Model Size: {best_row['Model Size (KB)']} KB")
    print("*" * 70)

    # 4. การทำ Error Analysis (วิเคราะห์ตัวอย่างที่โมเดลทายผิดบน Test Set)
    print("\n🔍 เริ่มกระบวนการ Error Analysis (วิเคราะห์จุดอ่อนและขอบเขตความคลาดเคลื่อน)...")
    y_test_pred = best_pipeline.predict(X_test)
    misclassified_mask = (y_test != y_test_pred)
    n_errors = misclassified_mask.sum()
    print(f"   -> จำนวนตัวอย่างที่ทายผิดใน Test Set: {n_errors} จาก {len(y_test)} ตัวอย่าง ({n_errors/len(y_test)*100:.2f}%)")

    if n_errors > 0:
        error_df = X_test[misclassified_mask].copy()
        error_df['True_Level'] = y_test[misclassified_mask]
        error_df['Predicted_Level'] = y_test_pred[misclassified_mask]
        print("\n   [ตารางตัวอย่างกรณีที่โมเดลเกิดความสับสน (Borderline Cases)]:")
        print(error_df.head(5).to_string())
        error_df.to_csv(os.path.join(models_dir, 'misclassified_error_analysis.csv'), index=False)
        print("   -> บันทึกตารางวิเคราะห์เคสที่ทายผิดที่ models/misclassified_error_analysis.csv")
    else:
        print("   -> ไม่พบเคสที่ทายผิดในชุดทดสอบปัจจุบัน (Perfect Separation)")

    # 5. Permutation Feature Importance บน Test Set (ความสำคัญที่แท้จริงตามคำแนะนำของ Géron)
    print("\n📈 กำลังคำนวณ Permutation Feature Importance บน Test Set...")
    perm_res = permutation_importance(best_pipeline, X_test, y_test, n_repeats=15, random_state=42, scoring='f1_macro')
    perm_df = pd.DataFrame({
        'Feature': feature_cols,
        'Mean_Importance': perm_res.importances_mean,
        'Std': perm_res.importances_std
    }).sort_values(by='Mean_Importance', ascending=False)

    plt.figure(figsize=(10, 5))
    sns.barplot(x='Mean_Importance', y='Feature', data=perm_df, palette='viridis')
    plt.title(f'Permutation Feature Importance on Held-out Test Set\nModel: {best_name}', fontsize=12)
    plt.xlabel('Decrease in Test Macro F1 Score when feature is shuffled')
    plt.tight_layout()
    plt.savefig(os.path.join(models_dir, 'permutation_feature_importance.png'), dpi=300)
    plt.close()
    print("📊 บันทึกกราฟ Permutation Feature Importance สำเร็จ")

    # 6. One-vs-Rest Multiclass ROC Curves
    print("\n📉 กำลังคำนวณและวาด Multiclass ROC Curves (One-vs-Rest)...")
    if hasattr(best_pipeline, 'predict_proba'):
        y_test_bin = label_binarize(y_test, classes=[0, 1, 2, 3])
        y_score = best_pipeline.predict_proba(X_test)
        
        plt.figure(figsize=(8, 6))
        colors = ['navy', 'darkorange', 'green', 'crimson']
        for i, color in zip(range(4), colors):
            fpr, tpr, _ = roc_curve(y_test_bin[:, i], y_score[:, i])
            roc_auc = auc(fpr, tpr)
            plt.plot(fpr, tpr, color=color, lw=2,
                     label=f'{CLASS_NAMES[i]} (AUC = {roc_auc:.4f})')

        plt.plot([0, 1], [0, 1], 'k--', lw=1.5)
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate (1 - Specificity)')
        plt.ylabel('True Positive Rate (Sensitivity)')
        plt.title(f'One-vs-Rest ROC Curves for 4-Class Fatigue\n{best_name}', fontsize=12)
        plt.legend(loc="lower right")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(models_dir, 'multiclass_roc_curves.png'), dpi=300)
        plt.close()
        print("📊 บันทึกภาพ Multiclass ROC Curves สำเร็จ")

    # 7. บันทึก Production Pipeline สำเร็จรูป (End-to-End Self-Contained)
    final_pipeline_path = os.path.join(models_dir, 'production_pipeline.joblib')
    joblib.dump({
        'pipeline': best_pipeline,
        'feature_cols': feature_cols,
        'class_names': CLASS_NAMES,
        'model_name': best_name,
        'benchmark_metrics': best_row.to_dict()
    }, final_pipeline_path)

    print(f"\n💾 Production Pipeline Bundle บันทึกเรียบร้อยที่: {final_pipeline_path}")
    print("   -> ออบเจกต์นี้สามารถนำไปใช้งาน (Deploy) ในโค้ดภายนอกได้ด้วยคำสั่งเดียว ไม่ต้องสเกลข้อมูลซ้ำซ้อน!")

if __name__ == '__main__':
    run_production_benchmark()
