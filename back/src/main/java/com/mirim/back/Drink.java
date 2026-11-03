package com.mirim.back;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "drinks")
@Getter
@Setter
@NoArgsConstructor
public class Drink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "drink_id")
    private Integer drinkId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @Column(name = "category", nullable = false, length = 20)
    private String category;

    @Column(name = "drink_name", nullable = false, length = 100)
    private String drinkName;

    @Column(name = "base_price", nullable = false)
    private Integer basePrice;

    public Drink(Cafe cafe, String category, String drinkName, Integer basePrice) {
        this.cafe = cafe;
        this.category = category;
        this.drinkName = drinkName;
        this.basePrice = basePrice;
    }
}
