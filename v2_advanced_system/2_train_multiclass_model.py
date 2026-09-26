import os
import sys
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

CLASS_NAMES = [
    'Level 0: Alert',
    'Level 1: Mild',
    'Level 2: Moderate',
    'Level 3: Danger'
]

def train_and_evaluate_multiclass():
    print("=" * 75)
    print("🚀 เริ่มฝึกสอนโมเดลจำแนกระดับความเหนื่อยล้า 4 ระดับ (Multi-class Fatigue Model)")
    print("=" * 75)

    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, 'data', 'temporal_fatigue_multiclass.csv')
    df = pd.read_csv(data_path)
    print(f"📦 โหลดข้อมูล: {len(df)} แถว, {len(df.columns)} คอลัมน์")

    X = df.drop(columns=['target_level'])
    y = df['target_level']
    feature_cols = list(X.columns)

    # 1. Stratified Split 80:20
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"✂️ แบ่งชุดข้อมูล: Train = {len(X_train)} ตัวอย่าง, Test = {len(X_test)} ตัวอย่าง")

    # 2. Scaling (Fit on Train only to prevent Data Leakage)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    print("📏 สเกลข้อมูลสำเร็จด้วย StandardScaler")

    # 3. กำหนดโมเดล Multi-class 3 ตัว
    models = {
        'Multinomial Logistic Regression': LogisticRegression(multi_class='multinomial', solver='lbfgs', max_iter=500, random_state=42),
        'Support Vector Machine (RBF)': SVC(kernel='rbf', C=2.0, probability=True, random_state=42),
        'Random Forest Classifier': RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    }

    results = []
    trained_models = {}
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for idx, (name, model) in enumerate(models.items()):
        print(f"\n⚙️ กำลังฝึกสอนและประเมินผล: {name}...")
        model.fit(X_train_scaled, y_train)
        trained_models[name] = model

        train_pred = model.predict(X_train_scaled)
        test_pred = model.predict(X_test_scaled)

        test_acc = accuracy_score(y_test, test_pred)
        macro_f1 = f1_score(y_test, test_pred, average='macro')
        weighted_f1 = f1_score(y_test, test_pred, average='weighted')
        cv_f1 = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring='f1_macro')

        results.append({
            'Model': name,
            'Train Acc': round(accuracy_score(y_train, train_pred), 4),
            'Test Acc': round(test_acc, 4),
            'Macro F1': round(macro_f1, 4),
            'Weighted F1': round(weighted_f1, 4),
            '5-Fold CV Macro F1': f"{cv_f1.mean():.4f} ± {cv_f1.std():.4f}"
        })

        # วาด 4x4 Confusion Matrix
        cm = confusion_matrix(y_test, test_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='YlGnBu', ax=axes[idx],
                    xticklabels=['L0:Alert', 'L1:Mild', 'L2:Mod', 'L3:Danger'],
                    yticklabels=['L0:Alert', 'L1:Mild', 'L2:Mod', 'L3:Danger'])
        axes[idx].set_title(f"{name}\nMacro F1: {macro_f1:.4f}")
        axes[idx].set_xlabel('Predicted Level')
        axes[idx].set_ylabel('True Level')

    plt.tight_layout()
    plt.savefig(os.path.join(models_dir, 'multiclass_confusion_matrices.png'), dpi=300)
    plt.close()

    # 4. Feature Importance จาก Random Forest
    rf_best = trained_models['Random Forest Classifier']
    feat_df = pd.DataFrame({
        'Feature': feature_cols,
        'Importance': rf_best.feature_importances_
    }).sort_values('Importance', ascending=False)

    plt.figure(figsize=(9, 4.5))
    sns.barplot(x='Importance', y='Feature', data=feat_df, hue='Feature', palette='magma', legend=False)
    plt.title('Temporal & Biometric Feature Importance (4-Class Fatigue)')
    plt.xlabel('Importance Score')
    plt.tight_layout()
    plt.savefig(os.path.join(models_dir, 'temporal_feature_importance.png'), dpi=300)
    plt.close()

    results_df = pd.DataFrame(results)
    print("\n" + "=" * 85)
    print("🏆 สรุปผลการประเมินประสิทธิภาพ Multi-class Classification (4 ระดับ):")
    print("=" * 85)
    print(results_df.to_string(index=False))

    # เลือกรุ่นที่ดีที่สุดตาม Macro F1
    best_row = results_df.sort_values(by='Macro F1', ascending=False).iloc[0]
    best_name = best_row['Model']
    best_model = trained_models[best_name]

    print("\n" + "*" * 60)
    print(f"🌟 โมเดลที่ดีที่สุด: {best_name}")
    print(f"   Test Accuracy: {best_row['Test Acc']*100:.2f}% | Macro F1: {best_row['Macro F1']:.4f}")
    print("*" * 60)

    # บันทึก artifacts
    joblib.dump(best_model, os.path.join(models_dir, 'multiclass_model.joblib'))
    joblib.dump(scaler, os.path.join(models_dir, 'scaler.joblib'))
    joblib.dump(feature_cols, os.path.join(models_dir, 'feature_cols.joblib'))
    print("💾 บันทึก multiclass_model.joblib, scaler.joblib และ feature_cols.joblib เรียบร้อยแล้ว!")

if __name__ == '__main__':
    train_and_evaluate_multiclass()
